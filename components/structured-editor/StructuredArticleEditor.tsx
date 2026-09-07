"use client";

import { Plus } from "lucide-react";
import ArticleSectionEditor from "./ArticleSectionEditor";
import {
  createEmptyBlock,
  createEmptySection,
  duplicateBlock,
  moveItem,
  removeItem,
  type BlockType,
  type EditorArticle,
  type EditorIssue,
} from "@/lib/structured-editor";

export default function StructuredArticleEditor({
  article,
  issues,
  onChange,
}: {
  article: EditorArticle;
  issues: EditorIssue[];
  onChange: (article: EditorArticle) => void;
}) {
  function updateIntro(index: number, value: string) {
    onChange({
      ...article,
      intro: article.intro.map((item, itemIndex) => (itemIndex === index ? value : item)),
    });
  }

  return (
    <div className="se-stack">
      <div className="se-block">
        <p className="se-kicker">Introduction</p>
        <div className="se-stack">
          {(article.intro.length ? article.intro : [""]).map((paragraph, index) => (
            <div key={`intro-${index}`}>
              <label className="form-label" htmlFor={`intro-${index}`}>
                Intro paragraph {index + 1}
              </label>
              <textarea
                id={`intro-${index}`}
                className="form-textarea"
                value={paragraph}
                onChange={(event) => {
                  if (!article.intro.length) {
                    onChange({ ...article, intro: [event.target.value] });
                    return;
                  }
                  updateIntro(index, event.target.value);
                }}
                style={{ minHeight: 88 }}
              />
            </div>
          ))}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onChange({ ...article, intro: [...(article.intro.length ? article.intro : [""]), ""] })}
          >
            Add intro paragraph
          </button>
        </div>
      </div>

      {article.sections.map((section, index) => (
        <ArticleSectionEditor
          key={section.id}
          section={section}
          index={index}
          total={article.sections.length}
          issues={issues}
          onChange={(nextSection) =>
            onChange({
              ...article,
              sections: article.sections.map((item) => (item.id === section.id ? nextSection : item)),
            })
          }
          onMove={(direction) =>
            onChange({ ...article, sections: moveItem(article.sections, index, direction) })
          }
          onDelete={() => {
            if (confirm("Delete this section and all of its blocks?")) {
              onChange({ ...article, sections: removeItem(article.sections, index) });
            }
          }}
          onAddBlock={(type: BlockType) =>
            onChange({
              ...article,
              sections: article.sections.map((item, itemIndex) =>
                itemIndex === index
                  ? { ...item, blocks: [...item.blocks, createEmptyBlock(type)] }
                  : item,
              ),
            })
          }
          onMoveBlock={(blockIndex, direction) =>
            onChange({
              ...article,
              sections: article.sections.map((item, itemIndex) =>
                itemIndex === index
                  ? { ...item, blocks: moveItem(item.blocks, blockIndex, direction) }
                  : item,
              ),
            })
          }
          onDuplicateBlock={(blockIndex) => {
            const block = section.blocks[blockIndex];
            if (!block) return;
            onChange({
              ...article,
              sections: article.sections.map((item, itemIndex) =>
                itemIndex === index
                  ? {
                      ...item,
                      blocks: [
                        ...item.blocks.slice(0, blockIndex + 1),
                        duplicateBlock(block),
                        ...item.blocks.slice(blockIndex + 1),
                      ],
                    }
                  : item,
              ),
            });
          }}
          onDeleteBlock={(blockIndex) => {
            const block = section.blocks[blockIndex];
            const needsConfirm = block?.type === "image" || block?.type === "table";
            if (needsConfirm && !confirm("Delete this block?")) return;
            onChange({
              ...article,
              sections: article.sections.map((item, itemIndex) =>
                itemIndex === index
                  ? { ...item, blocks: removeItem(item.blocks, blockIndex) }
                  : item,
              ),
            });
          }}
        />
      ))}

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => onChange({ ...article, sections: [...article.sections, createEmptySection()] })}
      >
        <Plus size={14} />
        Add Section
      </button>
    </div>
  );
}
