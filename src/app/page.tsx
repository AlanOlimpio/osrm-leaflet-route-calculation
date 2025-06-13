"use client";
import dynamic from "next/dynamic";

// Carregue dinamicamente o componente do mapa com SSR desativado
const NavigatorMap = dynamic(() => import("@/components/navigator-map"), {
  ssr: false,
});

export default function Page() {
  return <NavigatorMap />;
}
