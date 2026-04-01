"use server";

import { redirect } from "next/navigation";

import { destroyUserSession } from "@/lib/auth/session";

export async function logoutAction() {
  await destroyUserSession();
  redirect("/login?success=تم تسجيل الخروج بنجاح.");
}
