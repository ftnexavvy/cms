export type UploadedImage = {
  url: string;
  absoluteUrl: string;
};

export async function uploadImageFile(file: File): Promise<UploadedImage> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Upload failed");
  }
  return {
    url: data.absoluteUrl || data.url || "",
    absoluteUrl: data.absoluteUrl || data.url || "",
  };
}
