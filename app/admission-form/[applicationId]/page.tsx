import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AdmissionPdfViewer from "@/components/admission-pdf-viewer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Official Admission Form | SmartIQ Institute",
  icons: {
    icon: "/icon.png",
  },
};

type Props = {
  params: Promise<{ applicationId: string }>;
};

export default async function AdmissionFormPage({ params }: Props) {
  const session = await getSessionUser();

  if (!session) redirect("/login");

  if (
    !["admin", "staff", "counsellor", "student", "parent"].includes(
      session.role,
    ) ||
    (session.status && session.status !== "active")
  ) {
    redirect("/dashboard");
  }

  const { applicationId } = await params;

  if (!/^SIQ-ADM-[A-Z0-9-]{8,60}$/.test(applicationId)) {
    notFound();
  }

  return <AdmissionPdfViewer applicationId={applicationId} />;
}
