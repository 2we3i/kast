import type { PropsWithChildren } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SettingsSectionProps {
  id: string;
  title: string;
  description?: string;
}

/** One titled card on the settings page, reachable as #id. */
export function SettingsSection(
  props: PropsWithChildren<SettingsSectionProps>,
) {
  return (
    <section id={props.id} aria-labelledby={`${props.id}-title`}>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id={`${props.id}-title`} className="text-base font-semibold">
              {props.title}
            </h2>
          </CardTitle>
          {props.description && (
            <CardDescription className="text-pretty">
              {props.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {props.children}
        </CardContent>
      </Card>
    </section>
  );
}
