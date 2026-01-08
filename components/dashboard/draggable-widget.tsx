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
    disabled: disableDrag,
  });

  const style = {
    transform: disableDrag ? undefined : CSS.Translate.toString(transform),
    opacity: disableDrag ? 1 : isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!disableDrag ? listeners : {})}
      {...(!disableDrag ? attributes : {})}
      className={`h-full w-full ${!disableDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      {children}
    </div>
  );
}
