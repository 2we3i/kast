import type { ComponentType } from "react";
import type { TemplateId } from "@/lib/templates";
import { ResumeBlockView } from "../resume-block-view";
import type { ResumeBlock } from "../resume-blocks";
import { AiryBlockView } from "./airy/airy-block-view";
import { BoldBlockView } from "./bold/bold-block-view";
import { ClassicBlockView } from "./classic/classic-block-view";
import { CompactBlockView } from "./compact/compact-block-view";
import { ElegantBlockView } from "./elegant/elegant-block-view";
import { ExecutiveBlockView } from "./executive/executive-block-view";
import { ModernBlockView } from "./modern/modern-block-view";
import { MonoBlockView } from "./mono/mono-block-view";
import { TimelineBlockView } from "./timeline/timeline-block-view";

export type BlockViewComponent = ComponentType<{ block: ResumeBlock }>;

/**
 * Presentation-layer registry: which block renderer draws each template. All
 * templates consume the same linear `ResumeBlock` sequence (only styling
 * differs) so pagination, exports, and parse order stay identical.
 */
export const TEMPLATE_BLOCK_VIEWS: Record<TemplateId, BlockViewComponent> = {
  standard: ResumeBlockView,
  compact: CompactBlockView,
  airy: AiryBlockView,
  bold: BoldBlockView,
  classic: ClassicBlockView,
  mono: MonoBlockView,
  modern: ModernBlockView,
  elegant: ElegantBlockView,
  timeline: TimelineBlockView,
  executive: ExecutiveBlockView,
};
