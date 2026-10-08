import type { HeaderView } from "./resume-preview";

/**
 * The design-mode QR code of the portfolio link. Renders nothing in ATS mode
 * or when the toggle is off; the link itself always stays a contact line.
 */
export function ResumeHeaderQr(props: {
  header: Pick<HeaderView, "qr" | "photoSize">;
  className?: string;
}) {
  if (!props.header.qr) return null;
  const size = Math.max(48, props.header.photoSize);
  return (
    <img
      src={props.header.qr}
      alt=""
      width={size}
      height={size}
      className={props.className}
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}
