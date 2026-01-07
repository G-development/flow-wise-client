import { apiFetch } from "@/lib/api";

export const handleEdit = () => {
  // noop: implementazione futura
};

export const handleDelete = async (key: string, id: string, fetchData: () => void) => {
  if (!confirm("Sei sicuro di voler eliminare questa transazione?")) return;

  try {
    const response = await apiFetch(`/${key}/delete/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Errore durante l'eliminazione");

    fetchData();
  } catch (error) {
    console.error(error);
  }
};
