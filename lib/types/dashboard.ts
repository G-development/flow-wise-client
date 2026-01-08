// Dashboard Widget Types
// Interfacce per gestire widget drag & drop nella dashboard

export interface WidgetPosition {
  x: number; // Colonna (0-3)
  y: number; // Riga (0-2)
  w: number; // Larghezza in celle (1-4)
  h: number; // Altezza in celle (1-3)
}

export interface Widget {
  id: string; // UUID univoco
  type: WidgetType; // Tipo di widget
  position: WidgetPosition;
  config?: WidgetConfig; // Configurazione opzionale specifica per tipo
}

export type WidgetType = "total-balance" | "period-incomes" | "period-expenses" | "income-vs-expenses" | "expense-breakdown";

export interface WidgetConfig {
  // Total Balance: nessuna config necessaria
  // Period Incomes: date range opzionale
  startDate?: string;
  endDate?: string;
}

export interface DashboardLayout {
  id?: string;
  user_id?: string;
  widgets: Widget[];
  created_at?: string;
  updated_at?: string;
}

// Default layout con i due widget base
export const DEFAULT_LAYOUT: Widget[] = [
  {
    id: "default-balance",
    type: "total-balance",
    position: { x: 0, y: 0, w: 2, h: 1 }, // 2 celle larghezza, 1 altezza
  },
  {
    id: "default-incomes",
    type: "period-incomes",
    position: { x: 2, y: 0, w: 2, h: 1 }, // Accanto al balance
  },
];

// Costanti griglia
export const GRID_COLS = 4;
export const GRID_ROWS = 3;

// Helper per validare posizione widget (no collision)
export function isValidPosition(
  widget: Widget,
  existingWidgets: Widget[]
): boolean {
  // Check bounds
  if (
    widget.position.x < 0 ||
    widget.position.y < 0 ||
    widget.position.x + widget.position.w > GRID_COLS ||
    widget.position.y + widget.position.h > GRID_ROWS
  ) {
    return false;
  }

  // Check collisions with existing widgets (escludendo se stesso)
  for (const other of existingWidgets) {
    if (other.id === widget.id) continue;

    const overlapsX =
      widget.position.x < other.position.x + other.position.w &&
      widget.position.x + widget.position.w > other.position.x;

    const overlapsY =
      widget.position.y < other.position.y + other.position.h &&
      widget.position.y + widget.position.h > other.position.y;

    if (overlapsX && overlapsY) {
      return false; // Collision detected
    }
  }

  return true;
}
