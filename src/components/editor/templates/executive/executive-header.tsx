import { ResumeContactIcon } from "../../resume-contact-icon";
import { ResumeHeaderPhoto } from "../../resume-header-photo";
import { ResumeHeaderQr } from "../../resume-header-qr";
import { ResumeOptionalLink } from "../../resume-optional-link";
import type { ContactView, HeaderView } from "../../resume-preview";

function ExecutiveContact(props: ContactView & { showIcons: boolean }) {
  return (
    <li className="flex items-center justify-end gap-2">
      <ResumeOptionalLink href={props.href} wrapPlain>
        {props.value}
      </ResumeOptionalLink>
      <ResumeContactIcon
        kind={props.kind}
        show={props.showIcons}
        edge="end"
        className="text-(--resume-accent)"
      />
    </li>
  );
}

export function ExecutiveHeader(props: HeaderView) {
  return (
    <header className="flex items-end gap-5 border-b-4 border-(--resume-accent) pb-3">
      <ResumeHeaderPhoto header={props} />
      <div className="min-w-0 flex-1">
        <h1 className="resume-name-3xl font-extrabold uppercase tracking-tight text-(--resume-accent)">
          {props.fullName}
        </h1>
        {props.headline && (
          <p className="mt-1 resume-name-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {props.headline}
          </p>
        )}
      </div>
      <ul className="space-y-0.5 text-right resume-body-xs">
        {props.contacts.map((contact) => (
          <ExecutiveContact
            key={contact.kind}
            showIcons={props.showIcons}
            {...contact}
          />
        ))}
      </ul>
      <ResumeHeaderQr header={props} />
    </header>
  );
}
