import { A } from "@mobily/ts-belt";
import { Fragment } from "react";
import { ResumeHeaderPhoto } from "../../resume-header-photo";
import { ResumeHeaderQr } from "../../resume-header-qr";
import { ResumeOptionalLink } from "../../resume-optional-link";
import type { HeaderView } from "../../resume-preview";

export function MonoHeader(props: HeaderView) {
  return (
    <header className="flex items-start gap-4 font-mono">
      <ResumeHeaderPhoto header={props} />
      <div className="min-w-0 flex-1">
        <h1 className="resume-name-xl font-bold">{props.fullName}</h1>
        {props.headline && (
          <p className="mt-0.5 resume-name-sm text-muted-foreground">
            {props.headline}
          </p>
        )}
        {A.isNotEmpty(props.contacts) && (
          <p className="mt-1.5 resume-body-xs text-muted-foreground">
            {props.contacts.map((contact, index) => (
              <Fragment key={contact.kind}>
                {index > 0 && <span aria-hidden> | </span>}
                <ResumeOptionalLink
                  href={contact.href}
                  className="underline"
                  wrapPlain
                >
                  {contact.value}
                </ResumeOptionalLink>
              </Fragment>
            ))}
          </p>
        )}
      </div>
      <ResumeHeaderQr header={props} />
    </header>
  );
}
