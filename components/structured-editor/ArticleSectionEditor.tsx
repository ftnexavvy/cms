"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import AddBlockMenu from "./AddBlockMenu";
import BlockToolbar from "./BlockToolbar";
import {
  HeadingBlockFields,
  ImageBlockFields,
  ListBlockFields,
  ParagraphBlockFields,
  TableBlockFields,
} from "./BlockFields";
import type { BlockType, EditorBlock, EditorIssue, EditorSection } from "@/lib/structured-editor";

const BLOCK_LABELS: Record<EditorBlock["type"], string> = {
  paragraph: "Paragraph",
  heading: "H3",
  list: "List",
  image: "Image",
  table: "Table",
};

export default function ArticleSectionEditor({
  section,
  index,
  total,
  issues,
  onChange,
  onMove,
  onDelete,
  onAddBlock,
  onMoveBlock,
  onDuplicateBlock,
  onDeleteBlock,
}: {
  section: EditorSection;
  index: number;
  total: number;
  issues: EditorIssue[];
  onChange: (section: EditorSection) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onAddBlock: (type: BlockType) => void;
  onMoveBlock: (blockIndex: number, direction: -1 | 1) => void;
  onDuplicateBlock: (blockIndex: number) => void;
  onDeleteBlock: (blockIndex: number) => void;
}) {
  const titleError = issues.find((issue) => issue.path === `sections.${index}.title`)?.message;
  const titleId = `section-${section.id}-title`;

  function updateBlock(blockIndex: number, block: EditorBlock) {
    onChange({
      ...section,
      blocks: section.blocks.map((item, itemIndex) => (itemIndex === blockIndex ? block : item)),
    });
  }

  return (
    <article className="se-section" aria-labelledby={titleId}>
      <div className="se-section-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="se-kicker">Section {String(index + 1).padStart(2, "0")}</p>
          <label className="form-label" htmlFor={titleId}>
            H2 title
          </label>
          <input
            id={titleId}
            className="form-input"
            value={section.title}
            onChange={(event) => onChange({ ...section, title: event.target.value })}
            placeholder="Section heading"
            aria-invalid={Boolean(titleError)}
            aria-describedby={titleError ? `${titleId}-error` : undefined}
            style={{ fontWeight: 600 }}
          />
          {titleError && (
            <p className="se-error" id={`${titleId}-error`}>
              {titleError}
            </p>
          )}
        </div>
        <div className="se-toolbar" role="toolbar" aria-label={`Section ${index + 1} controls`}>
          <button
            type="button"
            className="se-icon-btn"
            aria-label="Move section up"
            onClick={() => onMove(-1)}
            disabled={index === 0}
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            className="se-icon-btn"
            aria-label="Move section down"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
          >
            <ArrowDown size={14} />
          </button>
          <button type="button" className="se-icon-btn" aria-label="Delete section" onClick={onDelete}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="se-section-body">
        {section.blocks.map((block, blockIndex) => {
          const path = `sections.${index}.blocks.${blockIndex}`;
          return (
            <div key={block.id} className="se-block">
              <div className="se-block-head">
                <p className="se-block-type">{BLOCK_LABELS[block.type]}</p>
                <BlockToolbar
                  label={BLOCK_LABELS[block.type]}
                  canMoveUp={blockIndex > 0}
                  canMoveDown={blockIndex < section.blocks.length - 1}
                  onMoveUp={() => onMoveBlock(blockIndex, -1)}
                  onMoveDown={() => onMoveBlock(blockIndex, 1)}
                  onDuplicate={() => onDuplicateBlock(blockIndex)}
                  onDelete={() => onDeleteBlock(blockIndex)}
                />
              </div>
              {block.type === "paragraph" && (
                <ParagraphBlockFields
                  block={block}
                  path={path}
                  issues={issues}
                  onChange={(next) => updateBlock(blockIndex, next)}
                />
              )}
              {block.type === "heading" && (
                <HeadingBlockFields
                  block={block}
                  path={path}
                  issues={issues}
                  onChange={(next) => updateBlock(blockIndex, next)}
                />
              )}
              {block.type === "list" && (
                <ListBlockFields
                  block={block}
                  path={path}
                  onChange={(next) => updateBlock(blockIndex, next)}
                />
              )}
              {block.type === "image" && (
                <ImageBlockFields
                  block={block}
                  path={path}
                  issues={issues}
                  onChange={(next) => updateBlock(blockIndex, next)}
                />
              )}
              {block.type === "table" && (
                <TableBlockFields
                  block={block}
                  path={path}
                  issues={issues}
                  onChange={(next) => updateBlock(blockIndex, next)}
                />
              )}
            </div>
          );
        })}
        <AddBlockMenu onAdd={onAddBlock} />
      </div>
    </article>
  );
}
