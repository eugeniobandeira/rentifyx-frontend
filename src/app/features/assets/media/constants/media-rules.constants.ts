// Mirrors rentifyx-asset-registry-api's ValidationConstants.MediaRules.AllowedMimeTypes exactly.
export const ALLOWED_MEDIA_MIME_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
]);
