import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json(
      { error: "Parâmetro 'q' é obrigatório" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}`,
      {
        headers: {
          "User-Agent": "MeuAppRota/1.0 (seu-email@exemplo.com)",
        },
      }
    );

    if (!response.ok) {
      console.error("Erro na resposta Nominatim:", await response.text());
      return NextResponse.json(
        { error: "Erro na API do Nominatim" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro geral ao buscar no Nominatim:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
