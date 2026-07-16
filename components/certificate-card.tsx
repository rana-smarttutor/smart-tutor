"use client";

import { useState } from "react";
import { Award, Download, Eye, Calendar, Hash, X } from "@/components/ui-icons";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { Certificate } from "@/lib/types";
import { CertificateTemplateRenderer } from "@/components/certificate-template-renderer";

/* ------------------------------------------------------------------ */
/*  CertificateCard                                                    */
/* ------------------------------------------------------------------ */

function CertificateCard({
  certificate,
  onPreview,
}: {
  certificate: Certificate;
  onPreview: (cert: Certificate) => void;
}) {
  const isRevoked = certificate.status === "revoked";

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${
        isRevoked
          ? "border-slate-200 opacity-60"
          : "border-slate-200 hover:shadow-md hover:border-blue-200"
      }`}
    >
      {/* Compact preview */}
      <div className="relative aspect-[4/3] bg-slate-50">
        <CertificateTemplateRenderer
          certificate={certificate}
          compact
        />
        {isRevoked && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <span className="bg-red-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wider">
              Revoked
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
          {certificate.title}
        </h3>

        {/* Certificate number */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Hash size={12} className="shrink-0" />
          <span className="font-medium">{certificate.certificateNo}</span>
        </div>

        {/* Issue date */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Calendar size={12} className="shrink-0" />
          <span>
            {new Date(certificate.issuedDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Status badge */}
        <span
          className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isRevoked
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {certificate.status}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onPreview(certificate)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors"
            title="View full-size certificate preview"
          >
            <Eye size={14} />
            Preview
          </button>
          <button
            type="button"
            onClick={() => onPreview(certificate)}
            className="flex items-center gap-1.5 bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-blue-700 transition-colors"
            title="Download certificate as PDF file"
          >
            <Download size={14} />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Certificate Preview Modal                                          */
/* ------------------------------------------------------------------ */

function CertificatePreviewModal({
  certificate,
  onClose,
}: {
  certificate: Certificate;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const element = document.getElementById(`cert-dl-${certificate.id}`);
      if (element) {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`${certificate.certificateNo}.pdf`);
      }
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Close on backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              {certificate.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {certificate.certificateNo}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 bg-blue-600 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              {downloading ? "Generating PDF..." : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Certificate render area */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100 flex items-center justify-center">
          <div id={`cert-dl-${certificate.id}`} className="w-full max-w-4xl">
            <CertificateTemplateRenderer certificate={certificate} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DashboardCertificatesSection                                       */
/* ------------------------------------------------------------------ */

export function DashboardCertificatesSection({
  certificates,
  userName,
}: {
  certificates: Certificate[];
  userName: string;
}) {
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Award size={20} className="text-amber-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            My Certificates
          </h2>
          <p className="text-xs text-slate-500">
            {certificates.length} certificate
            {certificates.length !== 1 ? "s" : ""} issued
          </p>
        </div>
        <span className="ml-auto bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-full">
          {certificates.length}
        </span>
      </div>

      {/* Empty state */}
      {certificates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-100 rounded-full mb-4">
            <Award size={28} className="text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            No certificates issued yet
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Certificates will appear here once issued to you.
          </p>
        </div>
      ) : (
        /* Certificate grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <CertificateCard
              key={cert.id}
              certificate={cert}
              onPreview={setPreviewCert}
            />
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewCert && (
        <CertificatePreviewModal
          certificate={previewCert}
          onClose={() => setPreviewCert(null)}
        />
      )}
    </section>
  );
}
