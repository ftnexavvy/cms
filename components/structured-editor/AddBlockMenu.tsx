"use client";

import type { BlockType } from "@/lib/structured-editor";

const OPTIONS: { type: BlockType; label: string }[] = [
  { type: "paragraph", label: "Paragraph" },
  { type: "heading", label: "H3" },
  { type: "list", label: "List" },
  { type: "image", label: "Image" },
  { type: "table", label: "Table" },
];

export default function AddBlockMenu({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <div>
      <p className="se-kicker">Add block</p>
      <div className="se-add-row">
        {OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onAdd(option.type)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
