"use client";

import { Copy, Trash2, ArrowDown, ArrowUp } from "lucide-react";

type BlockToolbarProps = {
  label: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

export default function BlockToolbar({
  label,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  canMoveUp,
  canMoveDown,
}: BlockToolbarProps) {
  return (
    <div className="se-toolbar" role="toolbar" aria-label={`${label} controls`}>
      <button type="button" className="se-icon-btn" aria-label={`Move ${label} up`} onClick={onMoveUp} disabled={!canMoveUp}>
        <ArrowUp size={14} />
      </button>
      <button type="button" className="se-icon-btn" aria-label={`Move ${label} down`} onClick={onMoveDown} disabled={!canMoveDown}>
        <ArrowDown size={14} />
      </button>
      <button type="button" className="se-icon-btn" aria-label={`Duplicate ${label}`} onClick={onDuplicate}>
        <Copy size={14} />
      </button>
      <button type="button" className="se-icon-btn" aria-label={`Delete ${label}`} onClick={onDelete}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}
