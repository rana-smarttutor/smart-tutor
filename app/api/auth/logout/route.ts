import { clearSessionResponse, getSessionUser } from "@/lib/auth";
import { logAction } from "@/lib/audit-log";

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (session) {
    await logAction({
      action: "logout",
      category: "auth",
      details: `User ${session.email} (${session.name || session.id}) logged out`,
      path: "/api/auth/logout",
      method: "POST",
      request,
      session,
    });
  }

  return clearSessionResponse();
}
