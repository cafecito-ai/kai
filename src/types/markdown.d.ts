// Vite's `?raw` query suffix returns the file contents as a string. Used by
// Scope.tsx to load /docs/SCOPE_*.md at build time so the page is a static
// render — no client fetch, no extra network round trip.
declare module "*.md?raw" {
  const content: string;
  export default content;
}
