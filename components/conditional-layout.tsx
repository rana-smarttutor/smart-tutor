"use client";

import { usePathname } from "next/navigation";

export function ConditionalLayout({
  children,
  hideOnDashboard = true,
}: {
  children: React.ReactNode;
  hideOnDashboard?: boolean;
}) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  if (hideOnDashboard && isDashboard) return null;
  return <>{children}</>;
}
