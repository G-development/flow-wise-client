"use client";

import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent,
  closestCenter, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor,
} from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { Widget, GRID_COLS, GRID_ROWS, isValidPosition } from "@/lib/types/dashboard";
import { DraggableWidget } from "./draggable-widget";
import { WidgetRenderer } from "./widget-renderer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MoreVertical, Trash2 } from "lucide-react";

interface DashboardGridProps {
  widgets: Widget[];
  onLayoutChange: (widgets: Widget[]) => void;
  dateFilter?: { startDate?: string; endDate?: string };
  isEditMode?: boolean;
  onRemoveWidget?: (widgetId: string) => void;
}

export function DashboardGrid({ widgets, onLayoutChange, dateFilter, isEditMode = false, onRemoveWidget }: DashboardGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [gridRef, setGridRef] = useState<HTMLDivElement | null>(null);

  // Detect viewport to toggle mobile stacking
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener("change", handler as (ev: MediaQueryListEvent) => void);
    return () => mq.removeEventListener("change", handler as (ev: MediaQueryListEvent) => void);
  }, []);

  // In mobile view, stack widgets in a single column and normalize positions
  const effectiveWidgets = useMemo(() => {
    if (!isMobile) return widgets;
    return widgets.map((w, idx) => ({
      ...w,
      position: { ...w.position, x: 0, y: idx, w: 1, h: 1 },
    }));
  }, [widgets, isMobile]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Previene drag accidentale
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (isMobile || !isEditMode) return; // disabilita drag su mobile e in view mode
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isMobile) {
      setActiveId(null);
      return; // drag off su mobile
    }
    setActiveId(null);
    
    const { active, delta } = event;
    const widgetId = active.id as string;
    
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget || !gridRef) return;

    // Calcola dimensioni reali delle celle
    const gridRect = gridRef.getBoundingClientRect();
    const cellWidth = gridRect.width / GRID_COLS;
    const cellHeight = gridRect.height / GRID_ROWS;
    
    const deltaX = Math.round(delta.x / cellWidth);
    const deltaY = Math.round(delta.y / cellHeight);

    // Se non c'è movimento significativo, ignora
    if (deltaX === 0 && deltaY === 0) return;

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

  const activeWidget = effectiveWidgets.find((w) => w.id === activeId);

  const handleResize = (widgetId: string, w: number, h: number) => {
    if (isMobile) return; // evitiamo resize su mobile
    const widget = widgets.find((wdg) => wdg.id === widgetId);
    if (!widget) return;

    const resized: Widget = {
      ...widget,
      position: {
        ...widget.position,
        w: Math.min(Math.max(1, w), GRID_COLS),
        h: Math.min(Math.max(1, h), GRID_ROWS),
      },
    };

    // Clamp per non uscire dai bordi
    resized.position.x = Math.min(resized.position.x, GRID_COLS - resized.position.w);
    resized.position.y = Math.min(resized.position.y, GRID_ROWS - resized.position.h);

    if (!isValidPosition(resized, widgets)) {
      toast.error("Impossibile ridimensionare: collisione con un altro widget");
      return;
    }

    const updated = widgets.map((wdg) => (wdg.id === widgetId ? resized : wdg));
    onLayoutChange(updated);
    toast.success("Widget ridimensionato");
  };

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
        ref={setGridRef}
        className={`grid gap-2 md:gap-4 p-2 md:p-4 rounded-lg ${isEditMode ? 'border-2 border-dashed border-gray-300' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${isMobile ? 1 : GRID_COLS}, 1fr)`,
          gridTemplateRows: isMobile
            ? `repeat(${effectiveWidgets.length || 1}, minmax(150px, auto))`
            : `repeat(${GRID_ROWS}, minmax(150px, 1fr))`,
          ...(isEditMode && !isMobile && {
            backgroundImage: `
              repeating-linear-gradient(
                to right,
                transparent,
                transparent calc(100% / ${GRID_COLS} - 1px),
                rgba(150, 150, 150, 0.3) calc(100% / ${GRID_COLS} - 1px),
                rgba(150, 150, 150, 0.3) calc(100% / ${GRID_COLS})
              ),
              repeating-linear-gradient(
                to bottom,
                transparent,
                transparent calc(100% / ${GRID_ROWS} - 1px),
                rgba(150, 150, 150, 0.3) calc(100% / ${GRID_ROWS} - 1px),
                rgba(150, 150, 150, 0.3) calc(100% / ${GRID_ROWS})
              )
            `,
            backgroundSize: '100% 100%',
            backgroundPosition: '0 0',
            backgroundAttachment: 'local',
          }),
        }}
      >
        {effectiveWidgets.map((widget) => (
          <div 
            key={widget.id} 
            className={`relative group transition-all duration-300 ease-in-out ${isEditMode ? 'border border-dashed border-gray-300' : ''}`}
            style={{
              gridColumn: `${widget.position.x + 1} / span ${widget.position.w}`,
              gridRow: `${widget.position.y + 1} / span ${widget.position.h}`,
            }}
          >
            {!isMobile && (
              <>
                {/* Resize menu (visible on hover in edit mode) */}
                {isEditMode && (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <div className="absolute right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Resize widget</span>
                        </Button>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={4}>
                      <DropdownMenuItem onSelect={() => handleResize(widget.id, 1, 1)}>
                        1 x 1
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleResize(widget.id, 2, 1)}>
                        2 x 1
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleResize(widget.id, 2, 2)}>
                        2 x 2
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Remove button (visible on hover in edit mode) */}
                {isEditMode && onRemoveWidget && (
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveWidget(widget.id);
                        toast.success("Widget removed");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove widget</span>
                    </Button>
                  </div>
                )}
              </>
            )}

            <DraggableWidget widget={widget} disableDrag={isMobile || !isEditMode}>
              <WidgetRenderer widget={widget} dateFilter={dateFilter} />
            </DraggableWidget>
          </div>
        ))}
      </div>

      {/* Overlay durante il drag (solo in edit mode) */}
      {isEditMode && (
        <DragOverlay>
          {activeWidget ? (
            <div className="opacity-80">
              <WidgetRenderer widget={activeWidget} dateFilter={dateFilter} />
            </div>
          ) : null}
        </DragOverlay>
      )}
    </DndContext>
  );
}
