import { A } from "@mobily/ts-belt";
import { cn } from "@/lib/utils";
import { ResumeContactIcon } from "../../resume-contact-icon";
import { ResumeHeaderPhoto } from "../../resume-header-photo";
import { ResumeHeaderQr } from "../../resume-header-qr";
import { useResumeMode } from "../../resume-mode";
import { ResumeOptionalLink } from "../../resume-optional-link";
import type { ContactView, HeaderView } from "../../resume-preview";

function ModernContact(props: ContactView & { showIcons: boolean }) {
  return (
    <li className="flex items-center gap-1.5">
      <ResumeContactIcon kind={props.kind} show={props.showIcons} />
      <ResumeOptionalLink href={props.href} wrapPlain>
        {props.value}
      </ResumeOptionalLink>
    </li>
  );
}

/** Design mode sets the header on an accent band; ATS mode keeps it on paper. */
export function ModernHeader(props: HeaderView) {
  const { atsMode } = useResumeMode();
  return (
    <header
      className={cn(
        "flex items-center gap-5",
        !atsMode && "rounded-md bg-(--resume-accent) px-6 py-5 text-white",
      )}
    >
      <ResumeHeaderPhoto header={props} />
      <div className="min-w-0 flex-1">
        <h1 className="resume-name-2xl font-bold tracking-tight">
          {props.fullName}
        </h1>
        {props.headline && (
          <p
            className={cn(
              "mt-1 resume-name-sm font-medium",
              atsMode && "text-muted-foreground",
            )}
          >
            {props.headline}
          </p>
        )}
        {A.isNotEmpty(props.contacts) && (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 resume-body-xs">
            {props.contacts.map((contact) => (
              <ModernContact
                key={contact.kind}
                showIcons={props.showIcons}
                {...contact}
              />
            ))}
          </ul>
        )}
      </div>
      <ResumeHeaderQr header={props} className="rounded bg-white p-1" />
    </header>
  );
}
