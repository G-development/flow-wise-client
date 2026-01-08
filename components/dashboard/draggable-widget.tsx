"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Widget } from "@/lib/types/dashboard";

interface DraggableWidgetProps {
  widget: Widget;
  children: React.ReactNode;
  disableDrag?: boolean;
}

export function DraggableWidget({ widget, children, disableDrag }: DraggableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: widget.id,
  });

  const style = {
    gridColumn: `${widget.position.x + 1} / span ${widget.position.w}`,
    gridRow: `${widget.position.y + 1} / span ${widget.position.h}`,
    transform: disableDrag ? undefined : CSS.Translate.toString(transform),
    opacity: disableDrag ? 1 : isDragging ? 0.5 : 1,
    cursor: disableDrag ? "default" : isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!disableDrag ? listeners : {})}
      {...(!disableDrag ? attributes : {})}
      className="touch-none"
    >
      {children}
    </div>
  );
}
