"use server"

import { redirect } from "next/navigation"
import { adminLoginSchema } from "@/lib/validators"
import { getEnv } from "@/lib/env"
import { setAdminCookie } from "@/lib/auth"

type LoginState = { error: string } | undefined

export async function adminLogin(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = adminLoginSchema.safeParse({ password: formData.get("password") })
  if (!parsed.success) return { error: "Invalid input" }

  if (parsed.data.password !== getEnv().ADMIN_PASSWORD) {
    return { error: "Invalid password" }
  }

  await setAdminCookie()
  redirect("/admin")
}
