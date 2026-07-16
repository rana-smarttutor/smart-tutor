import { CertificateTemplateId } from "@/lib/types";

export type CertificateTemplateConfig = {
  id: CertificateTemplateId;
  name: string;
  description: string;
  previewGradient: string;
  accent: string;
  borderColor: string;
  bgStyle: string;
  headerStyle: string;
  titleStyle: string;
  nameStyle: string;
  bodyStyle: string;
  badgeStyle: string;
  signatureStyle: string;
  decorElement: string;
};

export const CERTIFICATE_TEMPLATES: CertificateTemplateConfig[] = [
  {
    id: "classic-gold",
    name: "Classic Gold",
    description: "Traditional certificate with elegant gold borders and timeless serif typography. Perfect for academic achievements.",
    previewGradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 30%, #fbbf24 60%, #f59e0b 100%)",
    accent: "#b8860b",
    borderColor: "#d4a843",
    bgStyle: "bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100",
    headerStyle: "text-amber-900",
    titleStyle: "text-amber-800 font-serif",
    nameStyle: "text-amber-900 font-serif italic",
    bodyStyle: "text-amber-700",
    badgeStyle: "bg-amber-100 text-amber-800 border-amber-300",
    signatureStyle: "text-amber-800",
    decorElement: "double-ring",
  },
  {
    id: "modern-blue",
    name: "Modern Blue",
    description: "Clean modern design with blue accents and sans-serif typography. Ideal for professional certifications.",
    previewGradient: "linear-gradient(135deg, #dbeafe 0%, #93c5fd 30%, #3b82f6 60%, #1d4ed8 100%)",
    accent: "#1d4ed8",
    borderColor: "#3b82f6",
    bgStyle: "bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100",
    headerStyle: "text-blue-800",
    titleStyle: "text-blue-900 font-sans",
    nameStyle: "text-blue-800 font-bold",
    bodyStyle: "text-slate-600",
    badgeStyle: "bg-blue-100 text-blue-700 border-blue-300",
    signatureStyle: "text-blue-800",
    decorElement: "geometric-corner",
  },
  {
    id: "professional-dark",
    name: "Professional Dark",
    description: "Sleek dark-themed certificate with silver accents. Bold and contemporary for special recognitions.",
    previewGradient: "linear-gradient(135deg, #1e293b 0%, #334155 30%, #475569 60%, #64748b 100%)",
    accent: "#c0c0c0",
    borderColor: "#94a3b8",
    bgStyle: "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900",
    headerStyle: "text-slate-200",
    titleStyle: "text-white font-sans",
    nameStyle: "text-white font-bold",
    bodyStyle: "text-slate-300",
    badgeStyle: "bg-slate-600 text-slate-200 border-slate-500",
    signatureStyle: "text-slate-300",
    decorElement: "diamond-line",
  },
];

export function getTemplateConfig(templateId: CertificateTemplateId): CertificateTemplateConfig {
  return CERTIFICATE_TEMPLATES.find((t) => t.id === templateId) ?? CERTIFICATE_TEMPLATES[0];
}

export function generateCertificateNo(): string {
  const prefix = "ST";
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${random}`;
}
