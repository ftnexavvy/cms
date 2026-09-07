"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";
import { uploadImageFile } from "@/lib/upload-client";
import {
  addTableColumn,
  addTableRow,
  paragraphHtmlFromEditor,
  removeTableColumn,
  removeTableRow,
  updateTableCell,
  updateTableHeader,
  type EditorBlock,
  type EditorIssue,
} from "@/lib/structured-editor";
import InlineRichText from "./InlineRichText";

function fieldError(issues: EditorIssue[], path: string) {
  return issues.find((issue) => issue.path === path)?.message;
}

export function ParagraphBlockFields({
  block,
  path,
  issues,
  onChange,
}: {
  block: Extract<EditorBlock, { type: "paragraph" }>;
  path: string;
  issues: EditorIssue[];
  onChange: (block: EditorBlock) => void;
}) {
  const error = fieldError(issues, `${path}.html`);
  return (
    <div>
      <InlineRichText
        value={block.html}
        onChange={(html) => onChange({ ...block, html: paragraphHtmlFromEditor(html) })}
        ariaLabel="Paragraph"
        describedBy={error ? `${path}-error` : undefined}
        invalid={Boolean(error)}
      />
      {error && (
        <p className="se-error" id={`${path}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function HeadingBlockFields({
  block,
  path,
  issues,
  onChange,
}: {
  block: Extract<EditorBlock, { type: "heading" }>;
  path: string;
  issues: EditorIssue[];
  onChange: (block: EditorBlock) => void;
}) {
  const error = fieldError(issues, `${path}.text`) || fieldError(issues, `${path}.level`);
  const inputId = `${path}-heading`;
  return (
    <div>
      <label className="form-label" htmlFor={inputId}>
        H3 heading
      </label>
      <input
        id={inputId}
        className="form-input"
        value={block.text}
        onChange={(event) => onChange({ ...block, level: 3, text: event.target.value })}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <p className="se-error" id={`${inputId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function ListBlockFields({
  block,
  path,
  onChange,
}: {
  block: Extract<EditorBlock, { type: "list" }>;
  path: string;
  onChange: (block: EditorBlock) => void;
}) {
  function updateItem(index: number, value: string) {
    onChange({
      ...block,
      items: block.items.map((item, itemIndex) => (itemIndex === index ? value : item)),
    });
  }

  return (
    <div className="se-stack">
      <div>
        <p className="form-label" id={`${path}-list-type`}>
          List type
        </p>
        <div className="se-add-row" role="group" aria-labelledby={`${path}-list-type`}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            aria-pressed={!block.ordered}
            onClick={() => onChange({ ...block, ordered: false })}
          >
            Bulleted
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            aria-pressed={block.ordered}
            onClick={() => onChange({ ...block, ordered: true })}
          >
            Numbered
          </button>
        </div>
      </div>
      <ol style={{ listStyle: block.ordered ? "decimal" : "disc", margin: 0, paddingLeft: 22 }}>
        {block.items.map((item, index) => (
          <li key={`${block.id}-${index}`} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="form-input"
                value={item}
                onChange={(event) => updateItem(index, event.target.value)}
                aria-label={`List item ${index + 1}`}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label={`Remove list item ${index + 1}`}
                onClick={() =>
                  onChange({
                    ...block,
                    items: block.items.filter((_, itemIndex) => itemIndex !== index),
                  })
                }
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onChange({ ...block, items: [...block.items, ""] })}
      >
        Add item
      </button>
    </div>
  );
}

export function ImageBlockFields({
  block,
  path,
  issues,
  onChange,
}: {
  block: Extract<EditorBlock, { type: "image" }>;
  path: string;
  issues: EditorIssue[];
  onChange: (block: EditorBlock) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const urlError = fieldError(issues, `${path}.url`);
  const altError = fieldError(issues, `${path}.alt`);

  async function upload(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const uploaded = await uploadImageFile(file);
      onChange({ ...block, url: uploaded.absoluteUrl || uploaded.url });
    } catch (error: any) {
      setUploadError(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="se-stack">
      {block.url ? (
        <img src={block.url} alt={block.alt || "Uploaded image preview"} className="se-image-preview" />
      ) : null}
      <div>
        <label className="form-label" htmlFor={`${path}-url`}>
          Image URL
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            id={`${path}-url`}
            className="form-input"
            value={block.url}
            onChange={(event) => onChange({ ...block, url: event.target.value })}
            placeholder="https://… or /uploads/…"
            aria-invalid={Boolean(urlError)}
            aria-describedby={urlError ? `${path}-url-error` : undefined}
            style={{ flex: 1, minWidth: 180 }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
            Upload
          </button>
          {block.url && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onChange({ ...block, url: "", caption: block.caption })}
            >
              <X size={13} />
              Remove
            </button>
          )}
        </div>
        {urlError && (
          <p className="se-error" id={`${path}-url-error`}>
            {urlError}
          </p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </div>
      {uploadError && <p className="se-error">{uploadError}</p>}
      <div>
        <label className="form-label" htmlFor={`${path}-alt`}>
          Alt text
        </label>
        <input
          id={`${path}-alt`}
          className="form-input"
          value={block.alt}
          onChange={(event) => onChange({ ...block, alt: event.target.value })}
          placeholder="Describe the image"
          aria-invalid={Boolean(altError)}
          aria-describedby={altError ? `${path}-alt-error` : undefined}
        />
        {altError && (
          <p className="se-error" id={`${path}-alt-error`}>
            {altError}
          </p>
        )}
      </div>
      <div>
        <label className="form-label" htmlFor={`${path}-caption`}>
          Caption (optional)
        </label>
        <input
          id={`${path}-caption`}
          className="form-input"
          value={block.caption}
          onChange={(event) => onChange({ ...block, caption: event.target.value })}
        />
      </div>
    </div>
  );
}

export function TableBlockFields({
  block,
  path,
  issues,
  onChange,
}: {
  block: Extract<EditorBlock, { type: "table" }>;
  path: string;
  issues: EditorIssue[];
  onChange: (block: EditorBlock) => void;
}) {
  const error =
    fieldError(issues, `${path}.headers`) ||
    issues.find((issue) => issue.path.startsWith(`${path}.rows`))?.message;

  return (
    <div className="se-stack">
      <div className="se-add-row">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange(addTableRow(block))}>
          Add row
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange(addTableColumn(block))}>
          Add column
        </button>
      </div>
      <div className="se-table-wrap">
        <table className="se-table">
          <thead>
            <tr>
              {block.headers.map((header, columnIndex) => (
                <th key={`${block.id}-h-${columnIndex}`}>
                  <label className="form-label" htmlFor={`${path}-h-${columnIndex}`}>
                    Header {columnIndex + 1}
                  </label>
                  <input
                    id={`${path}-h-${columnIndex}`}
                    className="form-input"
                    value={header}
                    onChange={(event) => onChange(updateTableHeader(block, columnIndex, event.target.value))}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 6 }}
                    onClick={() => {
                      if (block.headers.length > 1) onChange(removeTableColumn(block, columnIndex));
                    }}
                  >
                    Delete column
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={`${block.id}-r-${rowIndex}`}>
                {row.map((cell, columnIndex) => (
                  <td key={`${block.id}-r-${rowIndex}-c-${columnIndex}`}>
                    <label className="form-label" htmlFor={`${path}-r-${rowIndex}-c-${columnIndex}`}>
                      Row {rowIndex + 1}, column {columnIndex + 1}
                    </label>
                    <input
                      id={`${path}-r-${rowIndex}-c-${columnIndex}`}
                      className="form-input"
                      value={cell}
                      onChange={(event) =>
                        onChange(updateTableCell(block, rowIndex, columnIndex, event.target.value))
                      }
                    />
                    {columnIndex === 0 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ marginTop: 6 }}
                        onClick={() => onChange(removeTableRow(block, rowIndex))}
                      >
                        Delete row
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="se-error">{error}</p>}
      <div>
        <p className="se-kicker">Preview</p>
        <div className="se-table-wrap">
          <table className="se-preview-table">
            <thead>
              <tr>
                {block.headers.map((header, index) => (
                  <th key={`${block.id}-preview-h-${index}`}>{header || `Column ${index + 1}`}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`${block.id}-preview-r-${rowIndex}`}>
                  {row.map((cell, columnIndex) => (
                    <td key={`${block.id}-preview-r-${rowIndex}-c-${columnIndex}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
