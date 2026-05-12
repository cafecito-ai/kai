/**
 * Register the offline service worker. No-op in dev (Vite ships its own HMR
 * SW which conflicts), no-op when serviceWorker isn't available.
 *
 * Tiny on purpose — full PWA orchestration (update prompts, skip-waiting
 * UX, etc.) is intentionally not here. The only invariant we care about
 * for v1 is "the /crisis page works offline".
 */
export function registerCrisisOfflineWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return; // dev mode uses Vite's own SW

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        console.warn("crisis offline SW registration failed", err);
      });
  });
}
