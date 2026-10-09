import { describe, expect, it } from "vitest";
import {
  centeredCrop,
  clampCrop,
  MAX_ZOOM,
  sourceRect,
  zoomAround,
} from "./photo-crop-math";

const LANDSCAPE = { width: 1200, height: 800 };
const PORTRAIT = { width: 600, height: 900 };
const VIEWPORT = 256;

describe("photo crop geometry", () => {
  it("centers a landscape photo on its middle square", () => {
    const rect = sourceRect(
      centeredCrop(LANDSCAPE, VIEWPORT),
      LANDSCAPE,
      VIEWPORT,
    );
    expect(rect.sx).toBeCloseTo(200);
    expect(rect.sy).toBeCloseTo(0);
    expect(rect.side).toBeCloseTo(800);
  });

  it("centers a portrait photo vertically", () => {
    const rect = sourceRect(
      centeredCrop(PORTRAIT, VIEWPORT),
      PORTRAIT,
      VIEWPORT,
    );
    expect(rect.sx).toBeCloseTo(0);
    expect(rect.sy).toBeCloseTo(150);
    expect(rect.side).toBeCloseTo(600);
  });

  it("shows a smaller square when zoomed in", () => {
    const rect = sourceRect(
      centeredCrop(LANDSCAPE, VIEWPORT, 2),
      LANDSCAPE,
      VIEWPORT,
    );
    expect(rect.side).toBeCloseTo(400);
    expect(rect.sx).toBeCloseTo(400);
    expect(rect.sy).toBeCloseTo(200);
  });

  it("never lets the image leave a gap in the viewport", () => {
    const pushed = clampCrop({ zoom: 1, x: 50, y: -999 }, LANDSCAPE, VIEWPORT);
    const rect = sourceRect(pushed, LANDSCAPE, VIEWPORT);
    expect(rect.sx).toBeGreaterThanOrEqual(0);
    expect(rect.sy).toBeGreaterThanOrEqual(0);
    expect(rect.sx + rect.side).toBeLessThanOrEqual(LANDSCAPE.width + 1e-9);
    expect(rect.sy + rect.side).toBeLessThanOrEqual(LANDSCAPE.height + 1e-9);
  });

  it("keeps the zoom inside its bounds", () => {
    expect(clampCrop({ zoom: 0.2, x: 0, y: 0 }, LANDSCAPE, VIEWPORT).zoom).toBe(
      1,
    );
    expect(clampCrop({ zoom: 99, x: 0, y: 0 }, LANDSCAPE, VIEWPORT).zoom).toBe(
      MAX_ZOOM,
    );
  });

  it("zooms around the focus point", () => {
    const start = centeredCrop(LANDSCAPE, VIEWPORT);
    const focus = { x: 128, y: 128 };
    const before = sourceRect(start, LANDSCAPE, VIEWPORT);
    const after = sourceRect(
      zoomAround(start, 2, focus, LANDSCAPE, VIEWPORT),
      LANDSCAPE,
      VIEWPORT,
    );
    expect(before.sx + before.side / 2).toBeCloseTo(after.sx + after.side / 2);
    expect(before.sy + before.side / 2).toBeCloseTo(after.sy + after.side / 2);
  });
});
