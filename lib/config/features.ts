/**
 * Feature flags controlled via environment variables.
 * Set ENABLE_IMAGES=false in .env.local to disable all image fetching/search.
 */
export function isImagesEnabled(): boolean {
  return process.env.ENABLE_IMAGES !== "false";
}
