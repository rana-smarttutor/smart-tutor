"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import {
  Award,
  Download,
  FileText,
  Search,
  X,
  Users,
  RefreshCw,
  Trash2,
  Ban,
  Eye,
  Plus,
  ChevronDown,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
} from "@/components/ui-icons";

import type {
  Certificate,
  CertificateTemplateId,
  CertificateRecipientType,
  ManagedUser,
} from "@/lib/types";

import {
  CERTIFICATE_TEMPLATES,
  getTemplateConfig,
} from "@/lib/certificate-templates";

import { CertificateTemplateRenderer } from "@/components/certificate-template-renderer";

export function AdminCertificateManager({
  allUsers,
}: {
  allUsers: ManagedUser[];
}) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [form, setForm] = useState({
    templateId: "classic-gold" as CertificateTemplateId,
    recipientId: "",
    recipientSearch: "",
    title: "Certificate of Excellence",
    description: "",
    courseName: "",
  });

  const [recipientOpen, setRecipientOpen] = useState(false);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/certificates");
      const data = await res.json();
      if (data.certificates) {
        setCertificates(data.certificates as Certificate[]);
      } else {
        setError(data.error ?? "Failed to fetch certificates");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const totalIssued = certificates.filter((c) => c.status === "issued").length;
  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return certificates.filter((c) => {
      const d = new Date(c.createdAt);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [certificates]);

  const filteredUsers = useMemo(() => {
    if (!form.recipientSearch) return allUsers.slice(0, 20);
    const q = form.recipientSearch.toLowerCase();
    return allUsers
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [allUsers, form.recipientSearch]);

  const selectedUser = useMemo(
    () => allUsers.find((u) => u.id === form.recipientId) ?? null,
    [allUsers, form.recipientId]
  );

  const filteredCertificates = useMemo(() => {
    if (!searchQuery) return certificates;
    const q = searchQuery.toLowerCase();
    return certificates.filter(
      (c) =>
        c.recipientName.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.certificateNo.toLowerCase().includes(q)
    );
  }, [certificates, searchQuery]);

  const handleIssueCertificate = async () => {
    if (
      !form.recipientId ||
      !form.title.trim() ||
      !form.description.trim()
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const recipient = allUsers.find((u) => u.id === form.recipientId);
      const recipientType: CertificateRecipientType =
        recipient?.role === "educator"
          ? "educator"
          : recipient?.role === "parent"
            ? "parent"
            : "student";

      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: form.templateId,
          recipientId: form.recipientId,
          recipientName: recipient?.name ?? "",
          recipientEmail: recipient?.email ?? "",
          recipientType,
          title: form.title.trim(),
          description: form.description.trim(),
          courseName: form.courseName.trim() || undefined,
          issuedDate: new Date().toISOString().split("T")[0],
          issuedBy: "admin",
          issuedByName: "Administrator",
        }),
      });
      const data = await res.json();
      if (data.certificate) {
        setCertificates((prev) => [data.certificate, ...prev]);
        setShowForm(false);
        setForm({
          templateId: "classic-gold",
          recipientId: "",
          recipientSearch: "",
          title: "Certificate of Excellence",
          description: "",
          courseName: "",
        });
      } else {
        setError(data.error ?? "Failed to create certificate");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (certId: string) => {
    setActionLoading(certId);
    try {
      const res = await fetch(`/api/certificates/${certId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "revoked", revokeReason: "Revoked by administrator" }),
      });
      const data = await res.json();
      if (data.certificate) {
        setCertificates((prev) =>
          prev.map((c) => (c.id === certId ? data.certificate : c))
        );
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to revoke");
    } finally {
      setActionLoading(null);
      setRevokeConfirmId(null);
    }
  };

  const handleDelete = async (certId: string) => {
    setActionLoading(certId);
    try {
      const res = await fetch(`/api/certificates/${certId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCertificates((prev) => prev.filter((c) => c.id !== certId));
      } else {
        setError(data.error ?? "Failed to delete");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setActionLoading(null);
      setDeleteConfirmId(null);
    }
  };

  const handleDownloadPdf = async (cert: Certificate) => {
    const element = document.getElementById(`cert-preview-${cert.id}`);
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${cert.certificateNo}.pdf`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "PDF generation failed");
    }
  };

  const templatePreviewData = {
    recipientName: selectedUser?.name ?? "Recipient Name",
    title: form.title || "Certificate Title",
    description: form.description || "Certificate description will appear here",
    courseName: form.courseName || "",
    certificateNo: "ST-2026-0000",
    issuedDate: new Date().toISOString().split("T")[0],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Award size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Certificate Manager
            </h2>
            <p className="text-xs text-slate-500">
              Create, preview, and manage certificates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <FileText size={14} />
            <span>
              <span className="font-semibold text-slate-700">{totalIssued}</span> issued
            </span>
            <span className="text-slate-300">|</span>
            <Calendar size={14} />
            <span>
              <span className="font-semibold text-slate-700">{thisMonthCount}</span> this month
            </span>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Close" : "Issue New Certificate"}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
          >
            <XCircle size={16} className="text-red-500 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Issue Certificate Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Award size={16} className="text-blue-500" />
                Issue New Certificate
              </div>

              {/* Template Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Select Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CERTIFICATE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          templateId: tmpl.id as CertificateTemplateId,
                        }))
                      }
                      className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                        form.templateId === tmpl.id
                          ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50/30"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden mb-2 border border-slate-100">
                        <CertificateTemplateRenderer
                          certificate={{ ...templatePreviewData, templateId: tmpl.id, issuedByName: "SmartIQ Institute" }}
                          compact={true}
                        />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        {tmpl.name}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        {tmpl.description}
                      </p>
                      {form.templateId === tmpl.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckCircle size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Recipient
                </label>
                <div className="relative">
                  <button
                    onClick={() => setRecipientOpen(!recipientOpen)}
                    className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-left hover:border-slate-300 transition-colors"
                  >
                    <span
                      className={
                        selectedUser
                          ? "text-slate-800 font-medium"
                          : "text-slate-400"
                      }
                    >
                      {selectedUser
                        ? `${selectedUser.name} (${selectedUser.email})`
                        : "Search and select a recipient..."}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${recipientOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {recipientOpen && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-hidden">
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <Search
                            size={14}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="text"
                            value={form.recipientSearch}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                recipientSearch: e.target.value,
                              }))
                            }
                            placeholder="Search by name, email, or role..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto max-h-48">
                        {filteredUsers.length === 0 && (
                          <div className="px-3 py-4 text-xs text-slate-400 text-center">
                            No users found
                          </div>
                        )}
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setForm((p) => ({
                                ...p,
                                recipientId: user.id,
                                recipientSearch: "",
                              }));
                              setRecipientOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left text-xs hover:bg-slate-50 transition-colors ${
                              form.recipientId === user.id
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-700"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                              {user.name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {user.name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {user.email}
                              </p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium capitalize shrink-0">
                              {user.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Certificate Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Certificate of Excellence"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Course Name{" "}
                    <span className="text-slate-400 normal-case tracking-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.courseName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, courseName: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. JEE Advanced Preparation"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="e.g. For outstanding performance in academics and consistent dedication..."
                />
              </div>

              {/* Live Preview */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Live Preview
                </label>
                <div className="border border-slate-200 rounded-xl overflow-auto max-h-[480px] bg-slate-100 p-4">
                  <CertificateTemplateRenderer
                    certificate={{ ...templatePreviewData, templateId: form.templateId, issuedByName: "SmartIQ Institute" }}
                    compact={false}
                  />
                </div>
              </div>

              {/* Issue Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleIssueCertificate}
                  disabled={
                    submitting || !form.recipientId || !form.title.trim() || !form.description.trim()
                  }
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                  {submitting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Award size={16} />
                  )}
                  {submitting ? "Issuing..." : "Issue Certificate"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificate List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileText size={16} className="text-slate-400" />
            Issued Certificates
            <span className="text-xs font-normal text-slate-400">
              ({filteredCertificates.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search certificates..."
                className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-52"
              />
            </div>
            <button
              onClick={fetchCertificates}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">
            <RefreshCw size={18} className="animate-spin mr-2" />
            Loading certificates...
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Award size={32} className="mb-2 text-slate-300" />
            <p className="text-sm font-medium">No certificates found</p>
            <p className="text-xs mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Issue your first certificate to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 font-semibold">
                    Recipient
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    Title
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold hidden md:table-cell">
                    Template
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold hidden lg:table-cell">
                    Certificate No.
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold">
                    Status
                  </th>
                  <th className="text-right px-4 py-2.5 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCertificates.map((cert) => {
                  const tmpl = getTemplateConfig(cert.templateId);
                  return (
                    <tr
                      key={cert.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                            {cert.recipientName
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">
                              {cert.recipientName}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {cert.recipientEmail || cert.recipientType}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700 truncate max-w-[200px]">
                          {cert.title}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border"
                          style={{
                            background: tmpl.previewGradient,
                            borderColor: tmpl.borderColor,
                          }}
                        >
                          <span className="text-[10px]">{tmpl.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <code className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                          {cert.certificateNo}
                        </code>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-slate-500">
                          {new Date(cert.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {cert.status === "issued" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle size={10} />
                            Issued
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <Ban size={10} />
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => setPreviewCert(cert)}
                            className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors border border-slate-200 hover:border-blue-200"
                          >
                            <Eye size={12} />
                            Preview
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(cert)}
                            className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            <Download size={12} />
                            Download PDF
                          </button>
                          {cert.status === "issued" && (
                            <>
                              {revokeConfirmId === cert.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleRevoke(cert.id)}
                                    disabled={actionLoading === cert.id}
                                    className="flex items-center gap-1 text-[11px] font-medium bg-amber-500 text-white px-2.5 py-1.5 rounded-lg hover:bg-amber-600 transition-colors"
                                  >
                                    {actionLoading === cert.id
                                      ? "Revoking..."
                                      : "Confirm Revoke"}
                                  </button>
                                  <button
                                    onClick={() => setRevokeConfirmId(null)}
                                    className="text-[11px] font-medium bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-300 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setRevokeConfirmId(cert.id)}
                                  className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition-colors border border-slate-200 hover:border-amber-200"
                                >
                                  <Ban size={12} />
                                  Revoke
                                </button>
                              )}
                            </>
                          )}
                          {deleteConfirmId === cert.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(cert.id)}
                                disabled={actionLoading === cert.id}
                                className="flex items-center gap-1 text-[11px] font-medium bg-red-500 text-white px-2.5 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                              >
                                {actionLoading === cert.id ? "Deleting..." : "Confirm Delete"}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-[11px] font-medium bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(cert.id)}
                              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors border border-slate-200 hover:border-red-200"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Certificate Preview Modal */}
      <AnimatePresence>
        {previewCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setPreviewCert(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-blue-500" />
                  <span className="text-sm font-semibold text-slate-700">
                    Certificate Preview
                  </span>
                  <code className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                    {previewCert.certificateNo}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPdf(previewCert)}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download size={14} />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setPreviewCert(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6 bg-slate-100">
                <div
                  id={`cert-preview-${previewCert.id}`}
                  className="mx-auto"
                  style={{ maxWidth: 800 }}
                >
                  <CertificateTemplateRenderer
                    certificate={{
                      recipientName: previewCert.recipientName,
                      title: previewCert.title,
                      description: previewCert.description,
                      courseName: previewCert.courseName || "",
                      certificateNo: previewCert.certificateNo,
                      issuedDate: previewCert.issuedDate,
                      issuedByName: previewCert.issuedByName,
                      templateId: previewCert.templateId,
                    }}
                    compact={false}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
