import * as React from "react";

// "Mobile shell" detection — covers phones AND tablets.
// Per product decision: tablets must use the mobile layout (no fixed sidebar,
// bottom nav, sheets) just scaled up. Only true desktops get the sidebar.
//
// Rule: viewport width < DESKTOP_BREAKPOINT  →  mobile shell
//       OR any touch-primary device          →  mobile shell
//       Else                                 →  desktop shell
const DESKTOP_BREAKPOINT = 1280; // anything below this = phone or tablet

function detectMobile(): boolean {
  if (typeof window === "undefined") return false;
  const isTouch =
    window.matchMedia?.("(pointer: coarse)").matches ||
    (typeof navigator !== "undefined" &&
      (navigator.maxTouchPoints > 1 ||
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)));

  const narrow = window.innerWidth < DESKTOP_BREAKPOINT;

  // Touch devices (phones AND tablets including iPad Pro 12.9") use mobile shell.
  // Non-touch narrow viewports (e.g. resized desktop window) also use mobile shell.
  return narrow || isTouch;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const update = () => setIsMobile(detectMobile());
    update();

    const widthMql = window.matchMedia(`(max-width: ${DESKTOP_BREAKPOINT - 1}px)`);
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
