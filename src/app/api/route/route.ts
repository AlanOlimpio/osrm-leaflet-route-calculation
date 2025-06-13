import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, to } = body;

    if (
      !from ||
      !to ||
      typeof from.lat !== "number" ||
      typeof from.lon !== "number" ||
      typeof to.lat !== "number" ||
      typeof to.lon !== "number"
    ) {
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=polyline`;

    const response = await fetch(osrmUrl);
    if (!response.ok) {
      console.error("Erro OSRM:", await response.text());
      return NextResponse.json(
        { error: "Erro ao consultar OSRM" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Erro geral:", err);
    return NextResponse.json(
      { error: "Erro ao calcular rota com OSRM" },
      { status: 500 }
    );
  }
}
