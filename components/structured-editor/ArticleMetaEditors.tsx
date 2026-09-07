"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { CtaItem } from "@/lib/structured-content";
import { createEmptyFaq, type EditorFaq, type EditorIssue } from "@/lib/structured-editor";

export function FaqEditor({
  faqs,
  issues,
  onChange,
}: {
  faqs: EditorFaq[];
  issues: EditorIssue[];
  onChange: (faqs: EditorFaq[]) => void;
}) {
  return (
    <div className="se-stack">
      {faqs.map((faq, index) => {
        const error = issues.find((issue) => issue.path === `faqs.${index}`)?.message;
        return (
          <div key={faq.id} className="se-block">
            <div className="se-block-head">
              <p className="se-block-type">FAQ {index + 1}</p>
              <div className="se-toolbar" role="toolbar" aria-label={`FAQ ${index + 1} controls`}>
                <button
                  type="button"
                  className="se-icon-btn"
                  aria-label={`Move FAQ ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => {
                    if (index === 0) return;
                    const next = [...faqs];
                    const current = next[index];
                    const previous = next[index - 1];
                    if (!current || !previous) return;
                    next[index] = previous;
                    next[index - 1] = current;
                    onChange(next);
                  }}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="se-icon-btn"
                  aria-label={`Move FAQ ${index + 1} down`}
                  disabled={index === faqs.length - 1}
                  onClick={() => {
                    if (index === faqs.length - 1) return;
                    const next = [...faqs];
                    const current = next[index];
                    const following = next[index + 1];
                    if (!current || !following) return;
                    next[index] = following;
                    next[index + 1] = current;
                    onChange(next);
                  }}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  className="se-icon-btn"
                  aria-label={`Delete FAQ ${index + 1}`}
                  onClick={() => onChange(faqs.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="se-stack">
              <div>
                <label className="form-label" htmlFor={`${faq.id}-question`}>
                  Question
                </label>
                <input
                  id={`${faq.id}-question`}
                  className="form-input"
                  value={faq.question}
                  onChange={(event) =>
                    onChange(
                      faqs.map((item) =>
                        item.id === faq.id ? { ...item, question: event.target.value } : item,
                      ),
                    )
                  }
                  aria-invalid={Boolean(error)}
                />
              </div>
              <div>
                <label className="form-label" htmlFor={`${faq.id}-answer`}>
                  Answer
                </label>
                <textarea
                  id={`${faq.id}-answer`}
                  className="form-textarea"
                  value={faq.answer}
                  onChange={(event) =>
                    onChange(
                      faqs.map((item) =>
                        item.id === faq.id ? { ...item, answer: event.target.value } : item,
                      ),
                    )
                  }
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${faq.id}-error` : undefined}
                  style={{ minHeight: 88 }}
                />
              </div>
              {error && (
                <p className="se-error" id={`${faq.id}-error`}>
                  {error}
                </p>
              )}
            </div>
          </div>
        );
      })}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() =>
          onChange([...faqs, createEmptyFaq()])
        }
      >
        <Plus size={14} />
        Add FAQ
      </button>
    </div>
  );
}

export function CtaEditor({
  cta,
  issues,
  onChange,
}: {
  cta: CtaItem;
  issues: EditorIssue[];
  onChange: (cta: CtaItem) => void;
}) {
  const hrefError = issues.find((issue) => issue.path === "cta.href")?.message;
  return (
    <div className="se-stack">
      <div>
        <label className="form-label" htmlFor="cta-heading">
          Heading
        </label>
        <input
          id="cta-heading"
          className="form-input"
          value={cta.heading}
          onChange={(event) => onChange({ ...cta, heading: event.target.value })}
        />
      </div>
      <div>
        <label className="form-label" htmlFor="cta-body">
          Body
        </label>
        <textarea
          id="cta-body"
          className="form-textarea"
          value={cta.body}
          onChange={(event) => onChange({ ...cta, body: event.target.value })}
          style={{ minHeight: 88 }}
        />
      </div>
      <div>
        <label className="form-label" htmlFor="cta-label">
          Button label
        </label>
        <input
          id="cta-label"
          className="form-input"
          value={cta.label}
          onChange={(event) => onChange({ ...cta, label: event.target.value })}
        />
      </div>
      <div>
        <label className="form-label" htmlFor="cta-href">
          Button URL
        </label>
        <input
          id="cta-href"
          className="form-input"
          value={cta.href}
          onChange={(event) => onChange({ ...cta, href: event.target.value })}
          placeholder="/book-a-meeting/ or https://…"
          aria-invalid={Boolean(hrefError)}
          aria-describedby={hrefError ? "cta-href-error" : undefined}
        />
        {hrefError && (
          <p className="se-error" id="cta-href-error">
            {hrefError}
          </p>
        )}
      </div>
    </div>
  );
}

export function RelatedSlugsEditor({
  slugs,
  onChange,
}: {
  slugs: string[];
  onChange: (slugs: string[]) => void;
}) {
  const values = slugs.length ? slugs : [""];
  return (
    <div className="se-stack">
      {values.map((slug, index) => (
        <div key={`related-${index}`} style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="form-label" htmlFor={`related-slug-${index}`}>
              Related slug {index + 1}
            </label>
            <input
              id={`related-slug-${index}`}
              className="form-input"
              value={slug}
              onChange={(event) => {
                const next = [...values];
                next[index] = event.target.value;
                onChange(next);
              }}
              placeholder="seo-services-ahmedabad"
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ alignSelf: "end" }}
            aria-label={`Remove related slug ${index + 1}`}
            onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange([...values, ""])}>
        <Plus size={14} />
        Add related slug
      </button>
    </div>
  );
}
