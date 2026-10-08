import { A } from "@mobily/ts-belt";
import { Fragment } from "react";
import { ResumeHeaderPhoto } from "../../resume-header-photo";
import { ResumeHeaderQr } from "../../resume-header-qr";
import { ResumeOptionalLink } from "../../resume-optional-link";
import type { HeaderView } from "../../resume-preview";

export function ElegantHeader(props: HeaderView) {
  return (
    <header className="text-center font-serif">
      <ResumeHeaderPhoto header={props} className="mx-auto mb-3" />
      <h1 className="resume-name-3xl tracking-wide">{props.fullName}</h1>
      {props.headline && (
        <p className="mt-1 resume-name-sm italic text-(--resume-accent)">
          {props.headline}
        </p>
      )}
      {A.isNotEmpty(props.contacts) && (
        <p className="mt-2 resume-body-xs text-muted-foreground">
          {props.contacts.map((contact, index) => (
            <Fragment key={contact.kind}>
              {index > 0 && <span aria-hidden> · </span>}
              <ResumeOptionalLink href={contact.href} wrapPlain>
                {contact.value}
              </ResumeOptionalLink>
            </Fragment>
          ))}
        </p>
      )}
      <ResumeHeaderQr header={props} className="mx-auto mt-3" />
    </header>
  );
}
