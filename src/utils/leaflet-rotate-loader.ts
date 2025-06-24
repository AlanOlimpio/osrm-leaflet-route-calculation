import * as leaflet from "leaflet";

if (typeof window !== "undefined") {
  // Define L no escopo global antes de importar plugins que dependem disso
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).L = leaflet;

  // Importa dinamicamente leaflet-rotate apenas no client
  await import("leaflet-rotate")
    .then(() => {
      console.log("O leaflet-rotate carregado com sucesso");
    })
    .catch((err) => {
      console.error("Erro ao carregar leaflet-rotate:", err);
    });
}
