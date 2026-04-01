import type { Metadata } from "next";
import { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DentFlow | إدارة عيادات الأسنان",
    template: "%s | DentFlow"
  },
  description:
    "منصة SaaS عربية متخصصة لإدارة عيادات الأسنان والمواعيد والعلاج والفوترة والإشعارات في الأردن.",
  keywords: [
    "DentFlow",
    "إدارة عيادات الأسنان",
    "برنامج عيادة أسنان",
    "مواعيد المرضى",
    "فواتير العيادات"
  ]
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
