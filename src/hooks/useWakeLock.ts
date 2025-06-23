import { useEffect, useRef } from "react";

export default function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wakeLockRef.current = await (navigator as any).wakeLock.request(
            "screen"
          );
          console.log("Wake Lock ativado");
          if (wakeLockRef.current) {
            wakeLockRef.current.addEventListener("release", () => {
              console.log("Wake Lock liberado");
            });
          }
        }
      } catch (err) {
        console.error("❗ Falha ao ativar Wake Lock:", err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock(); // reativa se necessário
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release();
    };
  }, []);
}
