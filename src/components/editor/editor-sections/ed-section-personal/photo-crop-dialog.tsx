import {
  ArrowCounterClockwiseIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from "@phosphor-icons/react";
import {
  type KeyboardEvent,
  type PointerEvent,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  type CropState,
  centeredCrop,
  clampCrop,
  type ImageSize,
  MAX_ZOOM,
  MIN_ZOOM,
  sourceRect,
  zoomAround,
} from "./photo-crop-math";
import { renderCroppedPhoto } from "./photo-process";

/** The crop square on screen, in CSS px. */
const VIEWPORT = 256;
const KEY_STEP = 8;
const ZOOM_STEP = 0.1;

interface PhotoCropDialogProps {
  /** The image to crop, as a data or object URL; null closes the dialog. */
  source: string | null;
  onCancel: () => void;
  onApply: (photo: string) => void;
}

/** Square crop with drag to move, and slider, wheel, or keys to zoom. */
export function PhotoCropDialog(props: PhotoCropDialogProps) {
  const t = useTranslations("editor.personal");

  return (
    <Dialog
      open={props.source !== null}
      onOpenChange={(open) => !open && props.onCancel()}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("cropTitle")}</DialogTitle>
          <DialogDescription>{t("cropDescription")}</DialogDescription>
        </DialogHeader>
        {props.source && (
          <PhotoCropper
            key={props.source}
            source={props.source}
            onCancel={props.onCancel}
            onApply={props.onApply}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PhotoCropper(props: {
  source: string;
  onCancel: () => void;
  onApply: (photo: string) => void;
}) {
  const t = useTranslations("editor.personal");
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; crop: CropState } | null>(null);
  const [size, setSize] = useState<ImageSize | null>(null);
  const [crop, setCrop] = useState<CropState>({ zoom: 1, x: 0, y: 0 });

  function onLoad() {
    const element = image.current;
    if (!element) return;
    const natural = {
      width: element.naturalWidth,
      height: element.naturalHeight,
    };
    setSize(natural);
    setCrop(centeredCrop(natural, VIEWPORT));
  }

  function zoomTo(zoom: number) {
    if (!size) return;
    const center = { x: VIEWPORT / 2, y: VIEWPORT / 2 };
    setCrop((current) => zoomAround(current, zoom, center, size, VIEWPORT));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, crop };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || !size) return;
    setCrop(
      clampCrop(
        {
          zoom: start.crop.zoom,
          x: start.crop.x + event.clientX - start.x,
          y: start.crop.y + event.clientY - start.y,
        },
        size,
        VIEWPORT,
      ),
    );
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    if (!size) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const focus = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    const next = crop.zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1);
    setCrop(zoomAround(crop, next, focus, size, VIEWPORT));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!size) return;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [KEY_STEP, 0],
      ArrowRight: [-KEY_STEP, 0],
      ArrowUp: [0, KEY_STEP],
      ArrowDown: [0, -KEY_STEP],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      setCrop(
        clampCrop(
          { ...crop, x: crop.x + move[0], y: crop.y + move[1] },
          size,
          VIEWPORT,
        ),
      );
      return;
    }
    if (event.key === "+" || event.key === "=") zoomTo(crop.zoom + ZOOM_STEP);
    if (event.key === "-") zoomTo(crop.zoom - ZOOM_STEP);
  }

  function apply() {
    const element = image.current;
    if (!element || !size) return;
    const photo = renderCroppedPhoto(element, sourceRect(crop, size, VIEWPORT));
    if (photo) props.onApply(photo);
  }

  const scale = size
    ? (VIEWPORT / Math.min(size.width, size.height)) * crop.zoom
    : 1;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        role="application"
        aria-label={t("cropTitle")}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: arrow keys move the crop
        tabIndex={0}
        className="relative touch-none cursor-grab overflow-hidden rounded-lg bg-muted outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        style={{ width: VIEWPORT, height: VIEWPORT }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => {
          drag.current = null;
        }}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      >
        <img
          ref={image}
          src={props.source}
          alt=""
          draggable={false}
          onLoad={onLoad}
          className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left select-none"
          style={{
            transform: `translate(${crop.x}px, ${crop.y}px) scale(${scale})`,
            visibility: size ? "visible" : "hidden",
          }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10" />
      </div>
      <div className="flex w-full items-center gap-2">
        <MagnifyingGlassMinusIcon className="size-4 shrink-0 text-muted-foreground" />
        <Slider
          aria-label={t("cropZoom")}
          value={crop.zoom}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          onValueChange={(value) =>
            zoomTo(Array.isArray(value) ? value[0] : (value as number))
          }
        />
        <MagnifyingGlassPlusIcon className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <DialogFooter className="w-full">
        <Button
          type="button"
          variant="ghost"
          onClick={() => size && setCrop(centeredCrop(size, VIEWPORT))}
        >
          <ArrowCounterClockwiseIcon /> {t("cropReset")}
        </Button>
        <Button type="button" variant="outline" onClick={props.onCancel}>
          {t("cropCancel")}
        </Button>
        <Button type="button" disabled={!size} onClick={apply}>
          {t("cropApply")}
        </Button>
      </DialogFooter>
    </div>
  );
}
