import { SiteHeaderClient } from "@/components/site-header-client";
import { getSessionUser } from "@/lib/auth";

export async function SiteHeader() {
  const [session] = await Promise.all([getSessionUser()]);

  return <SiteHeaderClient session={session} />;
}
