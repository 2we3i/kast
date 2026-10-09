import { useEffect, useRef, useState } from "react";
import type { TemplateId } from "@/lib/templates";
import { ResumeFontFaces, resumeTypographyStyle } from "../resume-fonts";
import { A4 } from "../resume-geometry";
import { ResumeModeContext } from "../resume-mode";
import type { ResumePreview } from "../resume-preview";
import { TEMPLATE_BLOCK_VIEWS } from "../templates/template-block-view";
import { LetterBody } from "./letter-body";
import type { LetterView } from "./letter-view";

interface LetterDocumentProps {
  view: LetterView;
  /** The résumé's preview, for its typography and design mode. */
  preview: ResumePreview;
  template: TemplateId;
}

/**
 * The cover letter on A4 paper: the template's own header, then the letter.
 * A letter that runs past one page grows the sheet instead of paginating;
 * the PDF export paginates it.
 */
export function LetterDocument(props: LetterDocumentProps) {
  const BlockView = TEMPLATE_BLOCK_VIEWS[props.template];
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = width > 0 ? Math.min(1, width / A4.widthPx) : 1;

  return (
    <div
      ref={containerRef}
      className="w-full font-sans"
      style={resumeTypographyStyle(props.preview, props.template)}
    >
      <ResumeFontFaces />
      <div className="mx-auto" style={{ width: A4.widthPx * scale }}>
        <div
          style={{
            width: A4.widthPx,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <ResumeModeContext value={{ atsMode: props.preview.atsMode }}>
            <div
              className="rounded border bg-white text-foreground shadow-sm"
              style={{
                minHeight: A4.heightPx,
                padding: A4.marginPx,
                ["--foreground" as string]: "var(--color-neutral-950)",
                ["--muted-foreground" as string]: "var(--color-neutral-600)",
              }}
            >
              <BlockView
                block={{
                  id: "header",
                  kind: "header",
                  header: props.view.header,
                  gapBefore: 0,
                  keepWithNext: false,
                }}
              />
              <LetterBody view={props.view} />
            </div>
          </ResumeModeContext>
        </div>
      </div>
    </div>
  );
}
