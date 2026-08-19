export function notifySessionChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("what2eat:session-changed"));
}
