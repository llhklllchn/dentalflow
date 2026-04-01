import { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/guards";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  await requireSession();

  return <AppShell>{children}</AppShell>;
}
