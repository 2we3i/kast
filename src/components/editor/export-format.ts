export type ExportFormat =
  | "pdf"
  | "docx"
  | "txt"
  | "json"
  | "yaml"
  | "europass-xml"
  | "europass-json";

export const EXPORT_FORMATS: ExportFormat[] = [
  "pdf",
  "docx",
  "txt",
  "json",
  "yaml",
  "europass-xml",
  "europass-json",
];

/** The file extension each format writes. */
export const EXPORT_EXTENSIONS: Record<ExportFormat, string> = {
  pdf: "pdf",
  docx: "docx",
  txt: "txt",
  json: "json",
  yaml: "yaml",
  "europass-xml": "xml",
  "europass-json": "json",
};

/** The short label each format shows in the export picker. */
export const EXPORT_LABELS: Record<ExportFormat, string> = {
  pdf: "PDF",
  docx: "DOCX",
  txt: "TXT",
  json: "JSON",
  yaml: "YAML",
  "europass-xml": "Europass XML",
  "europass-json": "Europass JSON",
};
