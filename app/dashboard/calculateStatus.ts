export const getStatusColor = (amount: number) => {
  // Esempio di logica per il semaforo
  if (amount > 1000) return "text-red-500"; // Troppo alto
  if (amount > 500) return "text-yellow-500"; // Medio
  return "text-green-500"; // Ok
};
