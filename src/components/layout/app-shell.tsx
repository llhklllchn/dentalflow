import { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getSessionUser } from "@/lib/auth/session";
import { getVisibleNavigationItems } from "@/lib/constants/navigation";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const user = await getSessionUser();
  const navigationItems = user ? getVisibleNavigationItems(user.role) : [];

  return (
    <div className="app-shell-grid">
      <Sidebar items={navigationItems} />
      <div className="min-h-screen">
        <Topbar />
        <main className="px-4 pb-10 pt-5 md:px-8">
          <div className="mx-auto max-w-[1480px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
