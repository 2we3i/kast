import { ResumeHeaderContact } from "./resume-header-contact";
import { ResumeHeaderPhoto } from "./resume-header-photo";
import { ResumeHeaderQr } from "./resume-header-qr";
import type { HeaderView } from "./resume-preview";

export function ResumeHeader(props: HeaderView) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <ResumeHeaderPhoto header={props} />
        <div>
          <h1 className="resume-name-xl font-bold tracking-tight">
            {props.fullName}
          </h1>
          <p className="mt-1 resume-name-sm text-(--resume-accent)">
            {props.headline}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <ul className="space-y-1 resume-body-xs">
          {props.contacts.map((contact) => (
            <ResumeHeaderContact
              key={contact.kind}
              showIcons={props.showIcons}
              {...contact}
            />
          ))}
        </ul>
        <ResumeHeaderQr header={props} />
      </div>
    </header>
  );
}
