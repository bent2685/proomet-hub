"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import clsx from "clsx";
import type { CategoryNode } from "@/lib/articles";
import { ARTICLE_CATEGORY_NONE } from "@/lib/types";

export function CategoryTree({
  root,
  none,
  selected,
  onSelect,
}: {
  root: CategoryNode;
  none: CategoryNode;
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  return (
    <div className="text-sm space-y-0.5">
      <Row
        label="全部"
        count={root.count}
        active={selected === null}
        depth={0}
        onClick={() => onSelect(null)}
      />
      {none.count > 0 && (
        <Row
          label="默认（无分类）"
          count={none.count}
          active={selected === ARTICLE_CATEGORY_NONE}
          depth={0}
          onClick={() => onSelect(ARTICLE_CATEGORY_NONE)}
        />
      )}
      {root.children.map((n) => (
        <TreeNode key={n.key} node={n} depth={0} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: CategoryNode;
  depth: number;
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const active = selected === node.key;
  return (
    <div>
      <div
        className={clsx(
          "flex items-center gap-1 h-7 pr-2 rounded-md cursor-pointer hover:bg-bg-subtle",
          active && "bg-accent/10 text-fg",
        )}
        style={{ paddingLeft: depth * 12 + 4 }}
      >
        <button
          aria-label="toggle"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setOpen((o) => !o);
          }}
          className="size-5 grid place-items-center text-fg-subtle"
        >
          {hasChildren ? (
            open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />
          ) : (
            <span className="size-3.5" />
          )}
        </button>
        <button
          onClick={() => onSelect(node.key)}
          className="flex-1 min-w-0 flex items-center gap-1.5 text-left"
        >
          {open && hasChildren ? (
            <FolderOpen className="size-3.5 text-fg-subtle" />
          ) : (
            <Folder className="size-3.5 text-fg-subtle" />
          )}
          <span className="truncate">{node.name}</span>
          <span className="ml-auto text-[10px] text-fg-subtle">{node.count}</span>
        </button>
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((c) => (
            <TreeNode
              key={c.key}
              node={c}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  count,
  active,
  depth,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  depth: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-center h-7 pr-2 rounded-md hover:bg-bg-subtle text-left",
        active && "bg-accent/10 text-fg",
      )}
      style={{ paddingLeft: depth * 12 + 24 }}
    >
      <span className="truncate">{label}</span>
      <span className="ml-auto text-[10px] text-fg-subtle">{count}</span>
    </button>
  );
}
