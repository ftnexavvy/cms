export class PostPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostPayloadError";
  }
}

const KNOWN_BLOCK_TYPES = new Set(["paragraph", "heading", "list", "image", "table"]);
const INLINE_TAGS = new Set(["a", "strong", "em", "b", "i", "br", "span"]);
const SAFE_HREF = /^(https?:\/\/|\/|#|mailto:)/i;

export type ContentBlock =
  | { type: "paragraph"; html: string }
  | { type: "heading"; level: 3; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "image"; url: string; alt: string; caption: string }
  | { type: "table"; headers: string[]; rows: string[][] };

export type FaqItem = { question: string; answer: string };

export type CtaItem = {
  heading: string;
  body: string;
  label: string;
  href: string;
};

export type StrategyItem = {
  title: string;
  paragraphs: string[];
  blocks: ContentBlock[];
};

export type StructuredContent = {
  intro: string[];
  strategies: StrategyItem[];
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function isSafeHref(href: string) {
  return SAFE_HREF.test(href);
}

export function sanitizeInlineHtml(input: string) {
  let strippedAnchors = 0;
  const withoutScripts = input.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");

  return withoutScripts.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (full, tag: string, attrs: string) => {
    const name = tag.toLowerCase();
    if (!INLINE_TAGS.has(name)) {
      return "";
    }
    if (name === "br") {
      return "<br />";
    }
    if (name === "a") {
      if (full.startsWith("</")) {
        if (strippedAnchors > 0) {
          strippedAnchors -= 1;
          return "";
        }
        return "</a>";
      }
      const hrefMatch = attrs.match(/\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = (hrefMatch?.[2] || hrefMatch?.[3] || hrefMatch?.[4] || "").trim();
      if (!href || !isSafeHref(href) || href.toLowerCase().startsWith("javascript:")) {
        strippedAnchors += 1;
        return "";
      }
      return `<a href="${href}">`;
    }
    if (full.startsWith("</")) {
      return `</${name}>`;
    }
    return `<${name}>`;
  });
}

function normalizeParagraph(block: Record<string, unknown>): ContentBlock | null {
  const html = sanitizeInlineHtml(asTrimmedString(block.html ?? block.text));
  if (!html) {
    return null;
  }
  return { type: "paragraph", html };
}

function normalizeHeading(block: Record<string, unknown>): ContentBlock | null {
  const text = asTrimmedString(block.text);
  if (!text) {
    return null;
  }
  const level = Number(block.level);
  if (level && level !== 3) {
    throw new PostPayloadError("Inner headings must be level 3. Use the strategy title for H2.");
  }
  return { type: "heading", level: 3, text };
}

function normalizeList(block: Record<string, unknown>): ContentBlock | null {
  const items = Array.isArray(block.items)
    ? block.items.map((item) => asTrimmedString(item)).filter(Boolean)
    : [];
  if (!items.length) {
    return null;
  }
  return {
    type: "list",
    ordered: Boolean(block.ordered),
    items,
  };
}

function normalizeImage(block: Record<string, unknown>): ContentBlock {
  const url = asTrimmedString(block.url);
  const alt = asTrimmedString(block.alt);
  if (!url || !alt) {
    throw new PostPayloadError("Image blocks require url and alt.");
  }
  return {
    type: "image",
    url,
    alt,
    caption: asTrimmedString(block.caption),
  };
}

function normalizeTable(block: Record<string, unknown>): ContentBlock {
  const headers = Array.isArray(block.headers)
    ? block.headers.map((header) => asTrimmedString(header))
    : [];
  if (!headers.length) {
    throw new PostPayloadError("Table blocks require a non-empty headers array.");
  }
  if (!Array.isArray(block.rows)) {
    throw new PostPayloadError("Table blocks require a rows array.");
  }

  const rows = block.rows.map((row, index) => {
    if (!Array.isArray(row)) {
      throw new PostPayloadError(`Table row ${index + 1} must be an array.`);
    }
    const cells = row.map((cell) => asTrimmedString(cell));
    if (cells.length !== headers.length) {
      throw new PostPayloadError(
        `Table row ${index + 1} must have ${headers.length} cells to match headers.`,
      );
    }
    return cells;
  });

  return { type: "table", headers, rows };
}

export function normalizeBlock(block: unknown): ContentBlock | null {
  if (!block || typeof block !== "object" || Array.isArray(block)) {
    return null;
  }

  const record = block as Record<string, unknown>;
  const type = asTrimmedString(record.type);
  if (!type) {
    return null;
  }
  if (!KNOWN_BLOCK_TYPES.has(type)) {
    return null;
  }

  switch (type) {
    case "paragraph":
      return normalizeParagraph(record);
    case "heading":
      return normalizeHeading(record);
    case "list":
      return normalizeList(record);
    case "image":
      return normalizeImage(record);
    case "table":
      return normalizeTable(record);
    default:
      return null;
  }
}

export function normalizeBlocks(blocks: unknown): ContentBlock[] {
  if (!Array.isArray(blocks)) {
    return [];
  }
  return blocks.map(normalizeBlock).filter((block): block is ContentBlock => Boolean(block));
}

export function normalizeStrategy(strategy: unknown): StrategyItem | null {
  if (!strategy || typeof strategy !== "object" || Array.isArray(strategy)) {
    return null;
  }

  const record = strategy as Record<string, unknown>;
  const title = asTrimmedString(record.title);
  const paragraphs = Array.isArray(record.paragraphs)
    ? record.paragraphs.map((item) => asTrimmedString(item)).filter(Boolean)
    : [];
  const blocks = normalizeBlocks(record.blocks);

  if (!title) {
    if (!paragraphs.length && !blocks.length) {
      return null;
    }
    throw new PostPayloadError("Each strategy/H2 section requires a title.");
  }

  return {
    title,
    paragraphs,
    blocks,
  };
}

export function normalizeStructuredContent(input: unknown): StructuredContent {
  const record = input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};

  const introSource = Array.isArray(record.intro) ? record.intro : [];
  const strategySource = Array.isArray(record.strategies) ? record.strategies : [];

  return {
    intro: introSource.map((item) => asTrimmedString(item)).filter(Boolean),
    strategies: strategySource
      .map(normalizeStrategy)
      .filter((strategy): strategy is StrategyItem => Boolean(strategy)),
  };
}

export function normalizeFaqs(input: unknown): FaqItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new PostPayloadError(`FAQ ${index + 1} must be an object with question and answer.`);
    }
    const record = item as Record<string, unknown>;
    const question = asTrimmedString(record.question);
    const answer = asTrimmedString(record.answer);
    if (!question || !answer) {
      throw new PostPayloadError(`FAQ ${index + 1} requires both question and answer.`);
    }
    return { question, answer };
  });
}

export function normalizeCta(input: unknown): CtaItem {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { heading: "", body: "", label: "", href: "" };
  }

  const record = input as Record<string, unknown>;
  const heading = asTrimmedString(record.heading);
  const body = asTrimmedString(record.body);
  const label = asTrimmedString(record.label);
  const href = asTrimmedString(record.href);
  const hasAny = Boolean(heading || body || label || href);

  if (hasAny && href && !isSafeHref(href)) {
    throw new PostPayloadError("CTA href must be an http(s) URL, mailto link, or site path.");
  }

  return { heading, body, label, href };
}

export function normalizeRelatedSlugs(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.map((item) => asTrimmedString(item)).filter(Boolean);
}
