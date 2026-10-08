import { useTransition } from "react";
import { useLocale } from "use-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { isLocale, rememberLocale } from "@/i18n/routing";

export function useLocaleSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (next: string) => {
    if (!isLocale(next)) return;

    rememberLocale(next);

    startTransition(() => {
      void router.replace(`${pathname}${window.location.search}`, {
        locale: next,
      });
    });
  };

  return { locale, isPending, switchLocale };
}
