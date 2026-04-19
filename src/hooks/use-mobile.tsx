import * as React from "react";

// Treat any device with a coarse pointer (touch) as mobile, regardless of
// orientation. This fixes the landscape bug on phones/tablets where width
// crosses the 768px threshold and the layout flips to desktop.
const MOBILE_BREAKPOINT = 768;

function detectMobile(): boolean {
  if (typeof window === "undefined") return false;
  const isTouch =
    window.matchMedia?.("(pointer: coarse)").matches ||
    // Fallback for older browsers / iPad Safari quirks
    (typeof navigator !== "undefined" &&
      (navigator.maxTouchPoints > 1 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)));
  // Use the smallest viewport edge so rotating a phone to landscape
  // (e.g. 844x390) is still considered mobile.
  const minEdge = Math.min(window.innerWidth, window.innerHeight);
  const narrow = window.innerWidth < MOBILE_BREAKPOINT || minEdge < MOBILE_BREAKPOINT;
  return isTouch || narrow;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const update = () => setIsMobile(detectMobile());
    update();

    const widthMql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const pointerMql = window.matchMedia("(pointer: coarse)");
    const orientationMql = window.matchMedia("(orientation: portrait)");

    widthMql.addEventListener("change", update);
    pointerMql.addEventListener("change", update);
    orientationMql.addEventListener("change", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      widthMql.removeEventListener("change", update);
      pointerMql.removeEventListener("change", update);
      orientationMql.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return !!isMobile;
}
