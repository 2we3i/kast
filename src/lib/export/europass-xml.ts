import { A, pipe, S } from "@mobily/ts-belt";
import type {
  EuropassContactInfo,
  EuropassDate,
  EuropassDocument,
  EuropassEducation,
  EuropassLabel,
  EuropassPeriod,
  EuropassWork,
} from "./europass";

const NAMESPACE = "http://europass.cedefop.europa.eu/Europass";
const SCHEMA =
  "http://europass.cedefop.europa.eu/xml/v3.4.0/EuropassSchema.xsd";

function escapeXml(text: string): string {
  return pipe(
    text,
    S.replaceByRe(/&/g, "&amp;"),
    S.replaceByRe(/</g, "&lt;"),
    S.replaceByRe(/>/g, "&gt;"),
    S.replaceByRe(/"/g, "&quot;"),
  );
}

/** An element with escaped text, or nothing when the text is empty. */
function el(name: string, text: string | undefined): string {
  if (!text) return "";
  return `<${name}>${escapeXml(text)}</${name}>`;
}

/** An element wrapping already-built children, or nothing when empty. */
function wrap(name: string, ...children: ReadonlyArray<string>): string {
  const inner = A.join(children, "");
  if (!inner) return "";
  return `<${name}>${inner}</${name}>`;
}

function label(name: string, value: EuropassLabel | undefined): string {
  if (!value) return "";
  return wrap(name, el("Code", value.Code), el("Label", value.Label));
}

/** Europass writes months as xs:gMonth ("--05"), so dates are attributes. */
function date(name: string, value: EuropassDate | undefined): string {
  if (!value) return "";
  const month = value.Month
    ? ` month="--${String(value.Month).padStart(2, "0")}"`
    : "";
  return `<${name} year="${value.Year}"${month}/>`;
}

function period(value: EuropassPeriod): string {
  return wrap(
    "Period",
    date("From", value.From),
    date("To", value.To),
    value.Current ? "<Current>true</Current>" : "",
  );
}

function contactInfo(info: EuropassContactInfo): string {
  const address = info.Address?.Contact;
  return wrap(
    "ContactInfo",
    address
      ? wrap(
          "Address",
          wrap(
            "Contact",
            el("Municipality", address.Municipality),
            label("Country", address.Country),
          ),
        )
      : "",
    info.Email ? wrap("Email", el("Contact", info.Email.Contact)) : "",
    wrap(
      "TelephoneList",
      ...A.map(info.Telephone ?? [], (phone) =>
        wrap(
          "Telephone",
          el("Contact", phone.Contact),
          wrap("Use", el("Code", phone.Use.Code)),
        ),
      ),
    ),
    wrap(
      "WebsiteList",
      ...A.map(info.Website ?? [], (site) =>
        wrap(
          "Website",
          el("Contact", site.Contact),
          wrap("Use", el("Code", site.Use.Code)),
        ),
      ),
    ),
  );
}

function work(item: EuropassWork): string {
  const contact = item.Employer.ContactInfo;
  return wrap(
    "WorkExperience",
    period(item.Period),
    wrap("Position", el("Label", item.Position.Label)),
    el("Activities", item.Activities),
    wrap(
      "Employer",
      el("Name", item.Employer.Name),
      contact
        ? wrap(
            "ContactInfo",
            contact.Address
              ? wrap(
                  "Address",
                  wrap(
                    "Contact",
                    el("Municipality", contact.Address.Contact.Municipality),
                  ),
                )
              : "",
            contact.Website
              ? wrap("Website", el("Contact", contact.Website.Contact))
              : "",
          )
        : "",
    ),
  );
}

function education(item: EuropassEducation): string {
  const city = item.Organisation.ContactInfo?.Address.Contact.Municipality;
  return wrap(
    "Education",
    period(item.Period),
    el("Title", item.Title),
    el("Activities", item.Activities),
    wrap(
      "Organisation",
      el("Name", item.Organisation.Name),
      city
        ? wrap(
            "ContactInfo",
            wrap("Address", wrap("Contact", el("Municipality", city))),
          )
        : "",
    ),
  );
}

function skills(
  value: EuropassDocument["SkillsPassport"]["LearnerInfo"]["Skills"],
): string {
  const linguistic = value.Linguistic;
  return wrap(
    "Skills",
    linguistic
      ? wrap(
          "Linguistic",
          wrap(
            "MotherTongueList",
            ...A.map(linguistic.MotherTongue, (item) =>
              wrap("MotherTongue", label("Description", item.Description)),
            ),
          ),
          wrap(
            "ForeignLanguageList",
            ...A.map(linguistic.ForeignLanguage, (item) =>
              wrap(
                "ForeignLanguage",
                label("Description", item.Description),
                wrap(
                  "ProficiencyLevel",
                  el("Listening", item.ProficiencyLevel?.Listening),
                  el("Reading", item.ProficiencyLevel?.Reading),
                  el(
                    "SpokenInteraction",
                    item.ProficiencyLevel?.SpokenInteraction,
                  ),
                  el(
                    "SpokenProduction",
                    item.ProficiencyLevel?.SpokenProduction,
                  ),
                  el("Writing", item.ProficiencyLevel?.Writing),
                ),
              ),
            ),
          ),
        )
      : "",
    value.JobRelated
      ? wrap("JobRelated", el("Description", value.JobRelated.Description))
      : "",
    value.Driving
      ? wrap(
          "Driving",
          wrap(
            "Description",
            ...A.map(value.Driving.Description, (licence) =>
              el("Licence", licence),
            ),
          ),
        )
      : "",
    value.Other
      ? wrap("Other", el("Description", value.Other.Description))
      : "",
  );
}

/**
 * Serializes the Europass object as SkillsPassport v3.4 XML. Rich text stays
 * HTML escaped inside its element, as the schema expects.
 */
export function europassToXml(doc: EuropassDocument): string {
  const passport = doc.SkillsPassport;
  const info = passport.DocumentInfo;
  const learner = passport.LearnerInfo;
  const body = A.join(
    [
      wrap(
        "DocumentInfo",
        el("DocumentType", info.DocumentType),
        el("CreationDate", info.CreationDate),
        el("LastUpdateDate", info.LastUpdateDate),
        el("XSDVersion", info.XSDVersion),
        el("Generator", info.Generator),
        el("Comment", info.Comment),
      ),
      wrap(
        "LearnerInfo",
        wrap(
          "Identification",
          wrap(
            "PersonName",
            el("FirstName", learner.Identification.PersonName.FirstName),
            el("Surname", learner.Identification.PersonName.Surname),
          ),
          contactInfo(learner.Identification.ContactInfo),
        ),
        learner.Headline
          ? wrap(
              "Headline",
              label("Type", learner.Headline.Type),
              wrap(
                "Description",
                el("Label", learner.Headline.Description.Label),
              ),
            )
          : "",
        wrap("WorkExperienceList", ...A.map(learner.WorkExperience, work)),
        wrap("EducationList", ...A.map(learner.Education, education)),
        skills(learner.Skills),
        wrap(
          "AchievementList",
          ...A.map(learner.Achievement, (item) =>
            wrap(
              "Achievement",
              label("Title", item.Title),
              el("Description", item.Description),
            ),
          ),
        ),
      ),
    ],
    "",
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<SkillsPassport xmlns="${NAMESPACE}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${NAMESPACE} ${SCHEMA}" locale="${escapeXml(passport.Locale)}">${body}</SkillsPassport>\n`;
}
