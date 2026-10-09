import { S } from "@mobily/ts-belt";

const PHOTO_SIZE = 256;
const JPEG_QUALITY = 0.85;
/** Larger uploads are downscaled before cropping, to keep memory in check. */
const SOURCE_MAX = 2048;

/**
 * Reads an image file into a data URL no larger than SOURCE_MAX on its long
 * side, for the crop dialog to show. Nothing leaves the browser.
 */
export async function readPhotoSource(file: File): Promise<string | null> {
  if (!S.startsWith(file.type, "image/")) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      SOURCE_MAX / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return null;
  }
}

/**
 * Draws the chosen square of `image` into a 256px JPEG data URL. The hard
 * downscale keeps the stored document small: the data URL lands in
 * IndexedDB, in every undo snapshot, and in the JSON/YAML interchange. A
 * white fill first, since JPEG has no alpha and a transparent PNG would
 * otherwise composite onto black.
 */
export function renderCroppedPhoto(
  image: CanvasImageSource,
  rect: { sx: number; sy: number; side: number },
): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_SIZE;
  canvas.height = PHOTO_SIZE;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE);
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    rect.sx,
    rect.sy,
    rect.side,
    rect.side,
    0,
    0,
    PHOTO_SIZE,
    PHOTO_SIZE,
  );
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
