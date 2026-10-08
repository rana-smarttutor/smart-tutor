import { redirect } from "next/navigation";

export default function AdmissionPage() {
  redirect("/dashboard/admissions/new");
}