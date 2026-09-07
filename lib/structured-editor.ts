import {
  PostPayloadError,
  isSafeHref,
  normalizeCta,
  normalizeFaqs,
  normalizeRelatedSlugs,
  normalizeStructuredContent,
  sanitizeInlineHtml,
  type ContentBlock,
  type CtaItem,
  type FaqItem,
  type StructuredContent,
} from "./structured-content";

export type EditorBlock =
  | { id: string; type: "paragraph"; html: string }
  | { id: string; type: "heading"; level: 3; text: string }
  | { id: string; type: "list"; ordered: boolean; items: string[] }
  | { id: string; type: "image"; url: string; alt: string; caption: string }
  | { id: string; type: "table"; headers: string[]; rows: string[][] };

export type EditorSection = {
  id: string;
  title: string;
  paragraphs: string[];
  blocks: EditorBlock[];
};

export type EditorFaq = {
  id: string;
  question: string;
  answer: string;
};

export type EditorArticle = {
  intro: string[];
  sections: EditorSection[];
};

export type EditorIssue = {
  path: string;
  message: string;
};

export const BLOCK_TYPES = ["paragraph", "heading", "list", "image", "table"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export function createEditorId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyBlock(type: BlockType): EditorBlock {
  const id = createEditorId();
  switch (type) {
    case "paragraph":
      return { id, type: "paragraph", html: "" };
    case "heading":
      return { id, type: "heading", level: 3, text: "" };
    case "list":
      return { id, type: "list", ordered: false, items: [""] };
    case "image":
      return { id, type: "image", url: "", alt: "", caption: "" };
    case "table":
      return {
        id,
        type: "table",
        headers: ["", ""],
        rows: [
          ["", ""],
          ["", ""],
        ],
      };
  }
}

export function createEmptySection(): EditorSection {
  return {
    id: createEditorId(),
    title: "",
    paragraphs: [],
    blocks: [],
  };
}

export function createEmptyFaq(): EditorFaq {
  return { id: createEditorId(), question: "", answer: "" };
}

export function createEmptyCta(): CtaItem {
  return { heading: "", body: "", label: "", href: "" };
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }
  const copy = [...items];
  const current = copy[index];
  const swapped = copy[nextIndex];
  if (current === undefined || swapped === undefined) {
    return items;
  }
  copy[index] = swapped;
  copy[nextIndex] = current;
  return copy;
}

export function duplicateItem<T>(items: T[], index: number, clone: (item: T) => T): T[] {
  const item = items[index];
  if (!item) {
    return items;
  }
  const copy = [...items];
  copy.splice(index + 1, 0, clone(item));
  return copy;
}

export function removeItem<T>(items: T[], index: number): T[] {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

export function duplicateBlock(block: EditorBlock): EditorBlock {
  const id = createEditorId();
  switch (block.type) {
    case "list":
      return { ...block, id, items: [...block.items] };
    case "table":
      return {
        ...block,
        id,
        headers: [...block.headers],
        rows: block.rows.map((row) => [...row]),
      };
    default:
      return { ...block, id };
  }
}

export function duplicateSection(section: EditorSection): EditorSection {
  return {
    ...section,
    id: createEditorId(),
    blocks: section.blocks.map(duplicateBlock),
  };
}

export function paragraphHtmlFromEditor(html: string) {
  const withBreaks = html
    .replace(/<\/(div|p)>/gi, "<br />")
    .replace(/<(div|p)[^>]*>/gi, "")
    .replace(/(<br\s*\/?>\s*)+$/gi, "");
  return sanitizeInlineHtml(withBreaks);
}

function asEditorBlock(block: Record<string, unknown>): EditorBlock {
  const id = createEditorId();
  const type = String(block.type || "");
  switch (type) {
    case "heading":
      return {
        id,
        type: "heading",
        level: 3,
        text: typeof block.text === "string" ? block.text : "",
      };
    case "list":
      return {
        id,
        type: "list",
        ordered: Boolean(block.ordered),
        items: Array.isArray(block.items)
          ? block.items.map((item) => (typeof item === "string" ? item : ""))
          : [""],
      };
    case "image":
      return {
        id,
        type: "image",
        url: typeof block.url === "string" ? block.url : "",
        alt: typeof block.alt === "string" ? block.alt : "",
        caption: typeof block.caption === "string" ? block.caption : "",
      };
    case "table":
      return {
        id,
        type: "table",
        headers: Array.isArray(block.headers)
          ? block.headers.map((item) => (typeof item === "string" ? item : ""))
          : ["", ""],
        rows: Array.isArray(block.rows)
          ? block.rows.map((row) =>
              Array.isArray(row) ? row.map((cell) => (typeof cell === "string" ? cell : "")) : [],
            )
          : [["", ""]],
      };
    case "paragraph":
    default:
      return {
        id,
        type: "paragraph",
        html: typeof (block as { html?: unknown }).html === "string"
          ? (block as { html: string }).html
          : typeof (block as { text?: unknown }).text === "string"
            ? (block as { text: string }).text
            : "",
      };
  }
}

export function editorArticleFromStructured(input: unknown): EditorArticle {
  const record = input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : {};
  const intro = Array.isArray(record.intro)
    ? record.intro.map((item) => (typeof item === "string" ? item : "")).filter((item) => item.trim())
    : [];
  const strategies = Array.isArray(record.strategies) ? record.strategies : [];

  return {
    intro,
    sections: strategies.map((strategy) => {
      if (!strategy || typeof strategy !== "object" || Array.isArray(strategy)) {
        return createEmptySection();
      }
      const value = strategy as Record<string, unknown>;
      const paragraphs = Array.isArray(value.paragraphs)
        ? value.paragraphs.map((item) => (typeof item === "string" ? item : "")).filter(Boolean)
        : [];
      const storedBlocks = Array.isArray(value.blocks) ? value.blocks : [];
      const blocks: EditorBlock[] = storedBlocks.length
        ? storedBlocks
            .map((block) => {
              if (!block || typeof block !== "object" || Array.isArray(block)) return null;
              const type = String((block as { type?: string }).type || "");
              if (!BLOCK_TYPES.includes(type as BlockType)) return null;
              return asEditorBlock(block as Record<string, unknown>);
            })
            .filter((block): block is EditorBlock => Boolean(block))
        : paragraphs.map((html) => ({ id: createEditorId(), type: "paragraph" as const, html }));

      return {
        id: createEditorId(),
        title: typeof value.title === "string" ? value.title : "",
        paragraphs,
        blocks,
      };
    }),
  };
}

export function faqsFromPayload(input: unknown): EditorFaq[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return createEmptyFaq();
    }
    const record = item as Record<string, unknown>;
    return {
      id: createEditorId(),
      question: typeof record.question === "string" ? record.question : "",
      answer: typeof record.answer === "string" ? record.answer : "",
    };
  });
}

export function ctaFromPayload(input: unknown): CtaItem {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return createEmptyCta();
  }
  const record = input as Record<string, unknown>;
  return {
    heading: typeof record.heading === "string" ? record.heading : "",
    body: typeof record.body === "string" ? record.body : "",
    label: typeof record.label === "string" ? record.label : "",
    href: typeof record.href === "string" ? record.href : "",
  };
}

export function relatedSlugsFromPayload(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.map((item) => (typeof item === "string" ? item : "")).filter((item) => item.trim());
}

function stripBlockId(block: EditorBlock): ContentBlock {
  const { id: _id, ...rest } = block;
  return rest as ContentBlock;
}

export function serializeEditorArticle(article: EditorArticle): StructuredContent {
  return {
    intro: article.intro.map((item) => item.trim()).filter(Boolean),
    strategies: article.sections.map((section) => ({
      title: section.title.trim(),
      paragraphs: section.paragraphs,
      blocks: section.blocks.map(stripBlockId),
    })),
  };
}

export function serializeEditorFaqs(faqs: EditorFaq[]): FaqItem[] {
  return faqs
    .map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() }))
    .filter((faq) => faq.question || faq.answer);
}

export function validateEditorState(input: {
  article: EditorArticle;
  faqs: EditorFaq[];
  cta: CtaItem;
  relatedSlugs: string[];
}): EditorIssue[] {
  const issues: EditorIssue[] = [];

  input.article.sections.forEach((section, sectionIndex) => {
    const hasContent =
      section.blocks.some((block) => blockHasPersistableContent(block)) ||
      section.paragraphs.some((paragraph) => paragraph.trim());
    if (hasContent && !section.title.trim()) {
      issues.push({
        path: `sections.${sectionIndex}.title`,
        message: "Section heading is required.",
      });
    }

    section.blocks.forEach((block, blockIndex) => {
      const path = `sections.${sectionIndex}.blocks.${blockIndex}`;
      if (block.type === "image") {
        if (!block.url.trim()) {
          issues.push({ path: `${path}.url`, message: "Image URL is required." });
        }
        if (!block.alt.trim()) {
          issues.push({ path: `${path}.alt`, message: "Image alt text is required." });
        }
      }
      if (block.type === "heading" && block.level !== 3) {
        issues.push({
          path: `${path}.level`,
          message: "Inner headings must be H3. Use the section title for H2.",
        });
      }
      if (block.type === "table") {
        if (!block.headers.length) {
          issues.push({ path: `${path}.headers`, message: "Table headers are required." });
        }
        block.rows.forEach((row, rowIndex) => {
          if (!Array.isArray(row) || row.length !== block.headers.length) {
            issues.push({
              path: `${path}.rows.${rowIndex}`,
              message: `Table row ${rowIndex + 1} must have ${block.headers.length} cells to match headers.`,
            });
          }
        });
      }
    });
  });

  serializeEditorFaqs(input.faqs).forEach((faq, index) => {
    if (!faq.question || !faq.answer) {
      issues.push({
        path: `faqs.${index}`,
        message: `FAQ ${index + 1} requires both question and answer.`,
      });
    }
  });

  const cta = input.cta;
  const hasCta = Boolean(cta.heading.trim() || cta.body.trim() || cta.label.trim() || cta.href.trim());
  if (hasCta && cta.href.trim() && !isSafeHref(cta.href.trim())) {
    issues.push({
      path: "cta.href",
      message: "CTA URL must be an http(s) link, mailto link, or site path.",
    });
  }

  if (input.relatedSlugs.some((slug) => typeof slug !== "string")) {
    issues.push({ path: "relatedSlugs", message: "Related articles must be a list of slugs." });
  }

  return issues;
}

function blockHasPersistableContent(block: EditorBlock) {
  switch (block.type) {
    case "paragraph":
      return Boolean(paragraphHtmlFromEditor(block.html).trim());
    case "heading":
      return Boolean(block.text.trim());
    case "list":
      return block.items.some((item) => item.trim());
    case "image":
      return Boolean(block.url.trim() || block.alt.trim() || block.caption.trim());
    case "table":
      return (
        block.headers.some((cell) => cell.trim()) ||
        block.rows.some((row) => row.some((cell) => cell.trim()))
      );
  }
}

export function buildStructuredPayload(input: {
  article: EditorArticle;
  faqs: EditorFaq[];
  cta: CtaItem;
  relatedSlugs: string[];
}) {
  const issues = validateEditorState(input);
  if (issues.length) {
    throw new PostPayloadError(issues[0]?.message || "Please fix the highlighted fields.");
  }

  const structuredContent = serializeEditorArticle(input.article);
  const faqs = serializeEditorFaqs(input.faqs);
  const cta = input.cta;
  const relatedSlugs = input.relatedSlugs.map((slug) => slug.trim()).filter(Boolean);

  return {
    structuredContent: normalizeStructuredContent(structuredContent),
    faqs: normalizeFaqs(faqs),
    cta: normalizeCta(cta),
    relatedSlugs: normalizeRelatedSlugs(relatedSlugs),
    issues,
  };
}

export function addTableRow(block: Extract<EditorBlock, { type: "table" }>) {
  return {
    ...block,
    rows: [...block.rows, block.headers.map(() => "")],
  };
}

export function addTableColumn(block: Extract<EditorBlock, { type: "table" }>) {
  return {
    ...block,
    headers: [...block.headers, ""],
    rows: block.rows.map((row) => [...row, ""]),
  };
}

export function removeTableRow(block: Extract<EditorBlock, { type: "table" }>, rowIndex: number) {
  if (block.rows.length <= 1) {
    return block;
  }
  return {
    ...block,
    rows: block.rows.filter((_, index) => index !== rowIndex),
  };
}

export function removeTableColumn(block: Extract<EditorBlock, { type: "table" }>, columnIndex: number) {
  if (block.headers.length <= 1) {
    return block;
  }
  return {
    ...block,
    headers: block.headers.filter((_, index) => index !== columnIndex),
    rows: block.rows.map((row) => row.filter((_, index) => index !== columnIndex)),
  };
}

export function updateTableHeader(
  block: Extract<EditorBlock, { type: "table" }>,
  columnIndex: number,
  value: string,
) {
  const headers = [...block.headers];
  headers[columnIndex] = value;
  return { ...block, headers };
}

export function updateTableCell(
  block: Extract<EditorBlock, { type: "table" }>,
  rowIndex: number,
  columnIndex: number,
  value: string,
) {
  const rows = block.rows.map((row, index) => {
    if (index !== rowIndex) return row;
    const next = [...row];
    next[columnIndex] = value;
    return next;
  });
  return { ...block, rows };
}
