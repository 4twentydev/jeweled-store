import { cookies } from "next/headers";

export async function getAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}
