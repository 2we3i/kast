import { A } from "@mobily/ts-belt";
import { CaretDownIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useTranslations } from "use-intl";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ImportDraft } from "@/lib/import";

interface ImportReviewDetailsProps {
  draft: ImportDraft;
}

/**
 * What the import did not put into the résumé, and why: removed page
 * furniture, text kept as metadata, and text that fit nowhere.
 */
export function ImportReviewDetails(props: ImportReviewDetailsProps) {
  const t = useTranslations("import.review");
  const { draft } = props;
  return (
    <div className="flex flex-col gap-2">
      {A.isNotEmpty(draft.removed) && (
        <DetailsGroup title={t("removed", { count: A.length(draft.removed) })}>
          {draft.removed.map((item, index) => (
            <li key={`${item.page}-${index}`}>
              <span className="text-muted-foreground">
                {t(`reasons.${item.reason}`)} · {t("page", { page: item.page })}
                :
              </span>{" "}
              {item.text}
            </li>
          ))}
        </DetailsGroup>
      )}
      {A.isNotEmpty(draft.metadata) && (
        <DetailsGroup
          title={t("metadata", { count: A.length(draft.metadata) })}
        >
          {draft.metadata.map((item, index) => (
            <li key={`${item.kind}-${index}`}>
              <span className="text-muted-foreground">
                {t(`metadataKinds.${item.kind}`)}:
              </span>{" "}
              {item.text}
            </li>
          ))}
        </DetailsGroup>
      )}
      {A.isNotEmpty(draft.leftovers) && (
        <DetailsGroup
          title={t("leftovers", { count: A.length(draft.leftovers) })}
        >
          {draft.leftovers.map((text) => (
            <li key={text} className="whitespace-pre-wrap">
              {text}
            </li>
          ))}
        </DetailsGroup>
      )}
    </div>
  );
}

function DetailsGroup(props: { title: string; children: ReactNode }) {
  return (
    <Collapsible className="rounded-lg border">
      <CollapsibleTrigger className="group flex w-full items-center justify-between px-3 py-2 text-sm font-medium">
        {props.title}
        <CaretDownIcon className="size-4 transition-transform group-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto px-3 pb-3 text-xs">
          {props.children}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
