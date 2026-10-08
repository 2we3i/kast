import type { PropsWithChildren } from "react";
import { PlatformNavbar } from "@/components/platform/platform-navbar";
import { PlatformSidebar } from "@/components/platform/platform-sidebar";
import { PlatformSidebarProvider } from "@/components/platform/platform-sidebar-provider";
import { TourProvider } from "@/components/tour/tour-provider";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";

/** The chrome every platform page shares: sidebar, navbar, tours. */
export function PlatformShell(props: PropsWithChildren) {
  return (
    <TourProvider>
      <PlatformSidebarProvider>
        <Sidebar>
          <PlatformSidebar />
        </Sidebar>

        {/* min-w-0 lets this flex-1 region shrink instead of being forced wide
            by its content (e.g. a long custom-section title), which otherwise
            pushes the layout past the viewport. */}
        <SidebarInset className="min-w-0">
          <PlatformNavbar />
          {props.children}
        </SidebarInset>
      </PlatformSidebarProvider>
    </TourProvider>
  );
}
