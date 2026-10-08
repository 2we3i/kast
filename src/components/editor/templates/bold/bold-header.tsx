import { A } from "@mobily/ts-belt";
import { ResumeHeaderContact } from "../../resume-header-contact";
import { ResumeHeaderPhoto } from "../../resume-header-photo";
import { ResumeHeaderQr } from "../../resume-header-qr";
import type { HeaderView } from "../../resume-preview";

export function BoldHeader(props: HeaderView) {
  return (
    <header className="flex items-start gap-4">
      <ResumeHeaderPhoto header={props} />
      <div className="min-w-0 flex-1">
        <h1 className="resume-name-3xl font-extrabold tracking-tight">
          {props.fullName}
        </h1>
        {props.headline && (
          <p className="mt-1 resume-name-sm font-medium text-muted-foreground">
            {props.headline}
          </p>
        )}
        {A.isNotEmpty(props.contacts) && (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 resume-body-xs">
            {props.contacts.map((contact) => (
              <ResumeHeaderContact
                key={contact.kind}
                showIcons={props.showIcons}
                {...contact}
              />
            ))}
          </ul>
        )}
      </div>
      <ResumeHeaderQr header={props} />
    </header>
  );
}
