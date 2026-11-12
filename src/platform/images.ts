/** Longest side kept for background images; plenty for a 4K screen with `background-size: cover`. */
export const MAX_BACKGROUND_SIDE = 2560;

/**
 * Shrinks a picked photo before it is stored: images larger than `maxSide` (or over 3 MB) are re-encoded as
 * JPEG at that size. Smaller images are kept as they are (so PNG transparency survives).
 */
export async function downscaleImage(file: Blob, maxSide = MAX_BACKGROUND_SIDE): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return file;
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 3 * 1024 * 1024) return file;
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not encode the image'))), 'image/jpeg', 0.85),
    );
  } finally {
    bitmap.close();
  }
}
