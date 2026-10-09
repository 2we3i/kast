/**
 * Geometry of the square photo crop. The image is shown inside a square
 * viewport, scaled so its shorter side fills the viewport at zoom 1, and
 * moved by an offset: the position of its top-left corner relative to the
 * viewport's. The offset is always clamped so the image covers the viewport,
 * which keeps every crop free of empty bands.
 */

export interface ImageSize {
  width: number;
  height: number;
}

export interface CropState {
  zoom: number;
  /** The image's top-left corner relative to the viewport, in viewport px. */
  x: number;
  y: number;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Viewport px per image px at zoom 1: the shorter side fills the viewport. */
export function baseScale(image: ImageSize, viewport: number): number {
  return viewport / Math.min(image.width, image.height);
}

function displayed(image: ImageSize, viewport: number, zoom: number) {
  const scale = baseScale(image, viewport) * zoom;
  return { width: image.width * scale, height: image.height * scale };
}

/** The same crop, nudged so the image still covers the whole viewport. */
export function clampCrop(
  state: CropState,
  image: ImageSize,
  viewport: number,
): CropState {
  const zoom = clamp(state.zoom, MIN_ZOOM, MAX_ZOOM);
  const size = displayed(image, viewport, zoom);
  return {
    zoom,
    x: clamp(state.x, viewport - size.width, 0),
    y: clamp(state.y, viewport - size.height, 0),
  };
}

/** The image centered in the viewport at `zoom`. */
export function centeredCrop(
  image: ImageSize,
  viewport: number,
  zoom = MIN_ZOOM,
): CropState {
  const size = displayed(image, viewport, zoom);
  return {
    zoom,
    x: (viewport - size.width) / 2,
    y: (viewport - size.height) / 2,
  };
}

/**
 * Changes the zoom while the point under `focus` (viewport px) stays put, the
 * way a map zooms around the cursor.
 */
export function zoomAround(
  state: CropState,
  nextZoom: number,
  focus: { x: number; y: number },
  image: ImageSize,
  viewport: number,
): CropState {
  const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
  const ratio = zoom / state.zoom;
  return clampCrop(
    {
      zoom,
      x: focus.x - (focus.x - state.x) * ratio,
      y: focus.y - (focus.y - state.y) * ratio,
    },
    image,
    viewport,
  );
}

/** The square of the source image the viewport shows, in image px. */
export function sourceRect(
  state: CropState,
  image: ImageSize,
  viewport: number,
): { sx: number; sy: number; side: number } {
  const scale = baseScale(image, viewport) * state.zoom;
  return {
    sx: -state.x / scale,
    sy: -state.y / scale,
    side: viewport / scale,
  };
}
