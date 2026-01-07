const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const handleEdit = (id: string) => {
  // noop: implementazione futura
};

export const handleDelete = async (key: string, id: string, fetchData: () => void) => {
  if (!confirm("Sei sicuro di voler eliminare questa transazione?")) return;

  try {
    const token = localStorage.getItem("fw-token");
    const response = await fetch(`${API_URL}/${key}/delete/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Errore durante l'eliminazione");

    fetchData();
  } catch (error) {
    console.error(error);
  }
};
