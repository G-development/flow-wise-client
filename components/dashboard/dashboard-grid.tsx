"use client";

import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent,
  closestCenter, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor 
} from "@dnd-kit/core";
import { useState } from "react";
import { Widget, GRID_COLS, GRID_ROWS, isValidPosition } from "@/lib/types/dashboard";
import { DraggableWidget } from "./draggable-widget";
import { WidgetRenderer } from "./widget-renderer";

interface DashboardGridProps {
  widgets: Widget[];
  onLayoutChange: (widgets: Widget[]) => void;
}

export function DashboardGrid({ widgets, onLayoutChange }: DashboardGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Previene drag accidentale
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    
    const { active, delta } = event;
    const widgetId = active.id as string;
    
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    // Calcola nuova posizione basata sul delta (movimento in pixels)
    // Assumiamo che ogni cella sia ~200px (da adattare con CSS)
    const cellWidth = 200; // Verrà calcolato dinamicamente nel componente
    const cellHeight = 150;
    
    const deltaX = Math.round(delta.x / cellWidth);
    const deltaY = Math.round(delta.y / cellHeight);

    const newWidget: Widget = {
      ...widget,
      position: {
        ...widget.position,
        x: Math.max(0, Math.min(GRID_COLS - widget.position.w, widget.position.x + deltaX)),
        y: Math.max(0, Math.min(GRID_ROWS - widget.position.h, widget.position.y + deltaY)),
      },
    };

    // Valida posizione (no collision)
    if (!isValidPosition(newWidget, widgets)) {
      console.warn("Invalid position: collision detected");
      return;
    }

    // Aggiorna layout
    const updatedWidgets = widgets.map((w) =>
      w.id === widgetId ? newWidget : w
    );
    onLayoutChange(updatedWidgets);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeWidget = widgets.find((w) => w.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Griglia principale */}
      <div
        className="grid gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg min-h-[500px]"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, minmax(150px, 1fr))`,
        }}
      >
        {widgets.map((widget) => (
          <DraggableWidget key={widget.id} widget={widget}>
            <WidgetRenderer widget={widget} />
          </DraggableWidget>
        ))}
      </div>

      {/* Overlay durante il drag */}
      <DragOverlay>
        {activeWidget ? (
          <div className="opacity-80">
            <WidgetRenderer widget={activeWidget} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
