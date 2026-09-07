"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Link2 } from "lucide-react";
import { isSafeHref } from "@/lib/structured-content";
import { paragraphHtmlFromEditor } from "@/lib/structured-editor";

type InlineRichTextProps = {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  ariaLabel: string;
  placeholder?: string;
  describedBy?: string;
  invalid?: boolean;
};

export default function InlineRichText({
  id,
  value,
  onChange,
  ariaLabel,
  placeholder,
  describedBy,
  invalid,
}: InlineRichTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState("");
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    if (!ref.current) return;
    if (value !== lastValue.current) {
      ref.current.innerHTML = value || "";
      lastValue.current = value;
    }
  }, [value]);

  function emit() {
    const html = paragraphHtmlFromEditor(ref.current?.innerHTML || "");
    lastValue.current = html;
    onChange(html);
  }

  function run(command: string, argument?: string) {
    document.execCommand(command, false, argument);
    ref.current?.focus();
    emit();
  }

  function applyLink() {
    const nextHref = href.trim();
    if (!nextHref || !isSafeHref(nextHref)) {
      setLinkError("Enter an http(s) URL, mailto link, or site path.");
      return;
    }
    run("createLink", nextHref);
    setLinkOpen(false);
    setHref("");
    setLinkError("");
  }

  return (
    <div>
      <div className="se-toolbar" role="toolbar" aria-label="Text formatting">
        <button
          type="button"
          className="se-icon-btn"
          aria-label="Bold"
          onMouseDown={(event) => {
            event.preventDefault();
            run("bold");
          }}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          className="se-icon-btn"
          aria-label="Italic"
          onMouseDown={(event) => {
            event.preventDefault();
            run("italic");
          }}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          className="se-icon-btn"
          aria-label="Insert link"
          aria-expanded={linkOpen}
          onMouseDown={(event) => {
            event.preventDefault();
            setLinkOpen((open) => !open);
          }}
        >
          <Link2 size={14} />
        </button>
      </div>
      {linkOpen && (
        <div style={{ display: "flex", gap: 8, margin: "8px 0", flexWrap: "wrap" }}>
          <input
            className="form-input"
            value={href}
            onChange={(event) => setHref(event.target.value)}
            placeholder="/contact/ or https://…"
            aria-label="Link URL"
            style={{ flex: 1, minWidth: 180 }}
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={applyLink}>
            Apply link
          </button>
        </div>
      )}
      {linkError && <p className="se-error">{linkError}</p>}
      <div
        id={id}
        ref={ref}
        className="se-richtext"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        data-placeholder={placeholder || "Write the paragraph…"}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={(event) => {
          event.preventDefault();
          const html = event.clipboardData.getData("text/html") || event.clipboardData.getData("text/plain");
          document.execCommand("insertHTML", false, paragraphHtmlFromEditor(html));
          emit();
        }}
      />
    </div>
  );
}
