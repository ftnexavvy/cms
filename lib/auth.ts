import { createHmac, randomBytes, timingSafeEqual, scryptSync } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "blog_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function base64UrlEncode(input: string) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }
  return secret;
}

export function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, savedHash] = storedHash.split(":");
  if (!salt || !savedHash) {
    return false;
  }

  const derivedHash = scryptSync(password, salt, 64);
  const savedBuffer = Buffer.from(savedHash, "hex");

  if (derivedHash.length !== savedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedHash, savedBuffer);
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function buildSessionToken(payload: { email: string; exp: number }) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function readSessionToken(token: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as {
    email: string;
    exp: number;
  };

  if (!payload.exp || payload.exp * 1000 < Date.now()) {
    return null;
  }

  return payload;
}

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL || "admin@example.com";
}

export function isValidAdminLogin(email: string, password: string) {
  const expectedEmail = getAdminEmail();
  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  const plainPassword = process.env.ADMIN_PASSWORD;

  if (email !== expectedEmail) {
    return false;
  }

  if (storedHash) {
    return verifyPassword(password, storedHash);
  }

  if (plainPassword) {
    return password === plainPassword;
  }

  throw new Error("ADMIN_PASSWORD_HASH or ADMIN_PASSWORD must be configured.");
}

export async function setAdminSession(email: string) {
  const cookieStore = await cookies();
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = buildSessionToken({ email, exp });

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return readSessionToken(token);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
