import type { ComponentProps } from "react";

type ExternalLinkProps = Omit<ComponentProps<"a">, "target" | "rel">;

/** An anchor that leaves the app in a new tab without passing a referrer. */
export function ExternalLink(props: ExternalLinkProps) {
  return <a {...props} target="_blank" rel="noreferrer noopener" />;
}
