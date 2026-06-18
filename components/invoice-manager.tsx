"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import type { FeeInvoice, ManagedUser, Role } from "@/lib/types";

type ReceiptInvoice = FeeInvoice & {
  receiptNo?: string;
  parentName?: string;
  classCourse?: string;
  batch?: string;
  rollNo?: string;
  academicYear?: string;
  mobileNo?: string;
  particulars?: string;
  month?: string;
  paymentMode?: string;
};

type InvoiceManagerProps = {
  role: Role;
  feeInvoices: ReceiptInvoice[];
  studentDirectory: ManagedUser[];
};

type SelectOption = {
  label: string;
  value: string;
};

type DropdownTheme = {
  backgroundColor: string;
  color: string;
  borderColor: string;
};

type CreateReceiptPayload = {
  studentId: string;
  studentName: string;
  parentName?: string;
  classCourse?: string;
  batch?: string;
  rollNo?: string;
  academicYear?: string;
  mobileNo?: string;
  particulars?: string;
  month?: string;
  paymentMode?: string;
  title: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: FeeInvoice["status"];
  notes?: string;
};

const INSTITUTE_LOGO_PATH = "/smart-tutors-logo.png";
const FOUNDER_SIGN_PATH = "/founder-sign.png";

const INSTITUTE_NAME = "Smart Tutors";
const INSTITUTE_WEBSITE = "www.smarttutors.co.in";
const INSTITUTE_PHONE = "+91 8850447887";
const INSTITUTE_EMAIL = "info@smarttutors.co.in";

const paymentModeOptions: SelectOption[] = [
  { label: "Online", value: "Online" },
  { label: "Cash", value: "Cash" },
  { label: "UPI", value: "UPI" },
  { label: "Bank Transfer", value: "Bank Transfer" },
  { label: "Cheque", value: "Cheque" },
];

const fallbackDropdownTheme: DropdownTheme = {
  backgroundColor: "#ffffff",
  color: "#0f172a",
  borderColor: "#cbd5e1",
};

const fieldClass =
  "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="relative space-y-2">
      <span className="block text-xs font-black uppercase tracking-[0.18em] text-blue-500">
        {label}
      </span>
      {children}
    </div>
  );
}

function parseColor(color: string): [number, number, number] | null {
  const value = color.trim();

  if (value.startsWith("#")) {
    const hex = value.replace("#", "");

    if (hex.length === 3) {
      const [r, g, b] = hex
        .split("")
        .map((char) => Number.parseInt(char + char, 16));

      return [r, g, b];
    }

    if (hex.length >= 6) {
      return [
        Number.parseInt(hex.slice(0, 2), 16),
        Number.parseInt(hex.slice(2, 4), 16),
        Number.parseInt(hex.slice(4, 6), 16),
      ];
    }
  }

  const match = value.match(/rgba?\(([^)]+)\)/);

  if (!match) return null;

  const parts = match[1]
    .split(",")
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()));

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  return [parts[0], parts[1], parts[2]];
}

function getLuminance(color: string) {
  const rgb = parseColor(color);

  if (!rgb) return 0;

  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function readCssVariable(name: string) {
  if (typeof window === "undefined") return "";

  const rootValue = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  if (rootValue) return rootValue;

  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function getDropdownTheme(): DropdownTheme {
  if (typeof window === "undefined") {
    return fallbackDropdownTheme;
  }

  const headingColor =
    readCssVariable("--color-heading") ||
    getComputedStyle(document.body).color ||
    fallbackDropdownTheme.color;

  const borderColor =
    readCssVariable("--color-border") || fallbackDropdownTheme.borderColor;

  const isDarkTheme = getLuminance(headingColor) > 0.55;

  return {
    backgroundColor: isDarkTheme ? "#020617" : "#ffffff",
    color: headingColor,
    borderColor,
  };
}

function useDropdownTheme() {
  const [theme, setTheme] = useState<DropdownTheme>(fallbackDropdownTheme);

  useEffect(() => {
    function updateTheme() {
      setTheme(getDropdownTheme());
    }

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select",
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const dropdownTheme = useDropdownTheme();

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder;

  return (
    <div className={`relative ${open ? "z-[9999]" : "z-30"}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={dropdownTheme}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold shadow-sm outline-none transition hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="text-xs opacity-70">▾</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close dropdown"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[9998] cursor-default bg-transparent"
          />

          <div
            style={dropdownTheme}
            className="absolute left-0 top-full z-[9999] mt-1 w-full overflow-hidden rounded-xl border shadow-2xl"
          >
            <div className="max-h-44 overflow-y-auto">
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={
                      isSelected ? undefined : { color: dropdownTheme.color }
                    }
                    className={`block w-full px-4 py-3 text-left text-sm font-semibold transition ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "hover:bg-blue-500/10"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function numberToWordsIndian(amount: number) {
  const number = Math.floor(Math.abs(amount));

  if (number === 0) return "Zero Rupees Only";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function belowHundred(value: number) {
    if (value < 20) return ones[value];

    return `${tens[Math.floor(value / 10)]} ${ones[value % 10]}`.trim();
  }

  function belowThousand(value: number) {
    const hundred = Math.floor(value / 100);
    const rest = value % 100;

    return `${hundred ? `${ones[hundred]} Hundred` : ""} ${
      rest ? belowHundred(rest) : ""
    }`.trim();
  }

  const crore = Math.floor(number / 10000000);
  const lakh = Math.floor((number % 10000000) / 100000);
  const thousand = Math.floor((number % 100000) / 1000);
  const hundred = number % 1000;

  const parts = [
    crore ? `${belowThousand(crore)} Crore` : "",
    lakh ? `${belowThousand(lakh)} Lakh` : "",
    thousand ? `${belowThousand(thousand)} Thousand` : "",
    hundred ? belowThousand(hundred) : "",
  ].filter(Boolean);

  return `${parts.join(" ")} Rupees Only`;
}

function getReceiptStatus(
  amount: number,
  paidAmount: number,
): FeeInvoice["status"] {
  if (paidAmount >= amount && amount > 0) return "paid";
  if (paidAmount > 0) return "partial";
  return "unpaid";
}

export function InvoiceManager({
  role,
  feeInvoices,
  studentDirectory,
}: InvoiceManagerProps) {
  const canEdit = role === "admin" || role === "educator";

  const [invoices, setInvoices] = useState<ReceiptInvoice[]>(feeInvoices);
  const [studentId, setStudentId] = useState(studentDirectory[0]?.id ?? "");
  const [paymentMode, setPaymentMode] = useState("Online");
  const [parentName, setParentName] = useState("");
  const [classCourse, setClassCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-26");
  const [mobileNo, setMobileNo] = useState("");
  const [particulars, setParticulars] = useState("Monthly Fee");
  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("0");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<ReceiptInvoice | null>(
    null,
  );

  const studentOptions = useMemo(
    () =>
      studentDirectory.length
        ? studentDirectory.map((student) => ({
            label: student.name,
            value: student.id,
          }))
        : [{ label: "No students found", value: "" }],
    [studentDirectory],
  );

  async function createInvoice() {
    if (!canEdit || !studentId) return;

    const student = studentDirectory.find((item) => item.id === studentId);

    if (!student) return;

    const totalAmount = Number(amount || 0);
    const receivedAmount = Number(paidAmount || 0);

    const receiptPayload: CreateReceiptPayload = {
      studentId: student.id,
      studentName: student.name,
      parentName: parentName.trim() || undefined,
      classCourse: classCourse.trim() || undefined,
      batch: batch.trim() || undefined,
      rollNo: rollNo.trim() || undefined,
      academicYear: academicYear.trim() || undefined,
      mobileNo: mobileNo.trim() || undefined,
      particulars: particulars.trim() || undefined,
      month: month.trim() || undefined,
      paymentMode: paymentMode.trim() || undefined,
      title: particulars.trim() || "Fee Receipt",
      amount: totalAmount,
      paidAmount: receivedAmount,
      dueDate,
      status: getReceiptStatus(totalAmount, receivedAmount),
      notes: notes.trim() || undefined,
    };

    setIsSaving(true);

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(receiptPayload),
      });

      const payload: { feeInvoice?: ReceiptInvoice } = await response.json();

      if (response.ok && payload.feeInvoice) {
        const newInvoice = {
          ...payload.feeInvoice,
          ...receiptPayload,
        } as ReceiptInvoice;

        setInvoices((current) => [newInvoice, ...current]);

        setParentName("");
        setClassCourse("");
        setBatch("");
        setRollNo("");
        setMobileNo("");
        setParticulars("Monthly Fee");
        setMonth("");
        setAmount("");
        setPaidAmount("0");
        setNotes("");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteInvoice(invoiceId: string) {
    if (!canEdit) return;

    setDeletingId(invoiceId);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setInvoices((current) =>
          current.filter((invoice) => invoice.id !== invoiceId),
        );
        setInvoiceToDelete(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  function getBalance(invoice: ReceiptInvoice) {
    return Math.max(invoice.amount - (invoice.paidAmount ?? 0), 0);
  }

  function openReceiptPdf(invoice: ReceiptInvoice) {
    const balance = getBalance(invoice);
    const receiptDate = invoice.createdAt
      ? new Date(invoice.createdAt).toLocaleDateString("en-IN")
      : new Date().toLocaleDateString("en-IN");

    const printDate = new Date().toLocaleString("en-IN");
    const logoUrl = `${window.location.origin}${INSTITUTE_LOGO_PATH}`;
    const founderSignUrl = `${window.location.origin}${FOUNDER_SIGN_PATH}`;
    const amountInWords = numberToWordsIndian(invoice.paidAmount ?? 0);

    const popup = window.open("", "_blank", "width=1000,height=1100");

    if (!popup) {
      alert("Please allow popups to download or print the receipt PDF.");
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(invoice.receiptNo || invoice.title)}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 16px;
              font-family: Arial, sans-serif;
              color: #000;
              background: #ffffff;
              font-size: 12px;
            }

            .receipt {
              width: 100%;
              max-width: 980px;
              margin: 0 auto;
              border: 2px solid #111;
              background: #ffffff;
            }

            .header {
              position: relative;
              min-height: 88px;
              border-bottom: 1px solid #111;
              padding: 10px 14px 8px;
              text-align: center;
            }

            .logo {
              position: absolute;
              left: 16px;
              top: 12px;
              width: 76px;
              height: 76px;
              object-fit: contain;
            }

            .institute {
              margin: 0;
              font-size: 19px;
              font-weight: 900;
              text-transform: capitalize;
            }

            .website {
              margin-top: 4px;
              font-size: 12px;
              font-weight: 700;
            }

            .contact {
              margin-top: 4px;
              font-size: 11px;
            }

            .title-row {
              display: flex;
              justify-content: center;
              align-items: center;
              position: relative;
              border-bottom: 1px solid #111;
              padding: 6px 12px;
            }

            .title-row h2 {
              margin: 0;
              font-size: 15px;
              text-decoration: underline;
            }

            .copy {
              position: absolute;
              right: 12px;
              font-size: 10px;
            }

            .details,
            .fee-table {
              width: 100%;
              border-collapse: collapse;
            }

            .details td {
              border-bottom: 1px solid #999;
              padding: 5px 8px;
              vertical-align: top;
            }

            .details .label {
              width: 125px;
              font-weight: 700;
            }

            .details .value {
              font-weight: 600;
            }

            .fee-table th,
            .fee-table td {
              border: 1px solid #999;
              padding: 6px 8px;
              text-align: left;
            }

            .fee-table th {
              font-weight: 800;
              background: #f3f4f6;
              text-align: center;
            }

            .fee-table .number {
              text-align: right;
              white-space: nowrap;
            }

            .summary {
              padding: 8px 10px;
              border-top: 1px solid #111;
              line-height: 1.7;
            }

            .summary strong {
              font-weight: 800;
            }

            .footer {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              border-top: 1px solid #111;
              padding: 12px 14px;
              min-height: 120px;
            }

            .footer-note {
              max-width: 56%;
              font-size: 11px;
              font-weight: 700;
              line-height: 1.5;
            }

            .signature-block {
              width: 220px;
              text-align: center;
              font-size: 11px;
              color: #111;
            }

            .signature-label {
              text-align: left;
              margin-bottom: 2px;
            }

            .signature-image {
              width: 150px;
              height: 52px;
              object-fit: contain;
              display: block;
              margin: 0 auto 2px;
            }

            .signature-name {
              font-weight: 800;
              border-top: 1px solid #111;
              padding-top: 4px;
              margin-top: 2px;
            }

            .signature-title {
              margin-top: 2px;
              font-size: 10px;
              font-weight: 700;
            }

            @media print {
              body {
                padding: 0;
              }

              .receipt {
                max-width: none;
                border: 2px solid #111;
              }
            }
          </style>
        </head>

        <body>
          <div class="receipt">
            <div class="header">
              <img src="${logoUrl}" class="logo" onerror="this.style.display='none'" />
              <h1 class="institute">${escapeHtml(INSTITUTE_NAME)}</h1>
              <div class="website">Website: ${escapeHtml(INSTITUTE_WEBSITE)}</div>
              <div class="contact">
                Phone: ${escapeHtml(INSTITUTE_PHONE)} | Email: ${escapeHtml(INSTITUTE_EMAIL)}
              </div>
            </div>

            <div class="title-row">
              <h2>*Fee Receipt*</h2>
              <div class="copy">Parent's Copy</div>
            </div>

            <table class="details">
              <tr>
                <td class="label">Receipt No</td>
                <td class="value">${escapeHtml(invoice.receiptNo || invoice.id)}</td>
                <td class="label">Receipt Date</td>
                <td class="value">${escapeHtml(receiptDate)}</td>
              </tr>
              <tr>
                <td class="label">Student Name</td>
                <td class="value">${escapeHtml(invoice.studentName)}</td>
                <td class="label">Parent Name</td>
                <td class="value">${escapeHtml(invoice.parentName || "-")}</td>
              </tr>
              <tr>
                <td class="label">Class / Course</td>
                <td class="value">${escapeHtml(invoice.classCourse || "-")}</td>
                <td class="label">Batch</td>
                <td class="value">${escapeHtml(invoice.batch || "-")}</td>
              </tr>
              <tr>
                <td class="label">Roll No</td>
                <td class="value">${escapeHtml(invoice.rollNo || "-")}</td>
                <td class="label">Academic Year</td>
                <td class="value">${escapeHtml(invoice.academicYear || "-")}</td>
              </tr>
              <tr>
                <td class="label">Mobile No</td>
                <td class="value">${escapeHtml(invoice.mobileNo || "-")}</td>
                <td class="label">Payment Mode</td>
                <td class="value">${escapeHtml(invoice.paymentMode || "-")}</td>
              </tr>
            </table>

            <table class="fee-table">
              <thead>
                <tr>
                  <th style="width: 55px;">Sr No</th>
                  <th>Particulars</th>
                  <th style="width: 120px;">Month</th>
                  <th style="width: 120px;">Due Date</th>
                  <th style="width: 110px;">Amount</th>
                  <th style="width: 110px;">Paid</th>
                  <th style="width: 110px;">Balance</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td style="text-align:center;">1</td>
                  <td>${escapeHtml(invoice.particulars || invoice.title)}</td>
                  <td>${escapeHtml(invoice.month || "-")}</td>
                  <td>${escapeHtml(invoice.dueDate)}</td>
                  <td class="number">${formatCurrency(invoice.amount)}</td>
                  <td class="number">${formatCurrency(invoice.paidAmount ?? 0)}</td>
                  <td class="number">${formatCurrency(balance)}</td>
                </tr>
              </tbody>
            </table>

            <div class="summary">
              <div><strong>Amount in Words:</strong> ${escapeHtml(amountInWords)}</div>
              <div>
                <strong>Payment Mode:</strong> ${escapeHtml(invoice.paymentMode || "-")}
                &nbsp; | &nbsp;
                <strong>Due Date:</strong> ${escapeHtml(invoice.dueDate)}
              </div>
              <div><strong>Print Date:</strong> ${escapeHtml(printDate)}</div>
            </div>

            <div class="footer">
              <div class="footer-note">
                This is a computer generated receipt.
              </div>

              <div class="signature-block">
                <img
                  src="${founderSignUrl}"
                  class="signature-image"
                  onerror="this.style.display='none'"
                />
                <div class="signature-name">Founder</div>
                <div class="signature-title">Authorized Signatory</div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);

    popup.document.close();
  }

  return (
    <section className="space-y-6">
      <div className="surface overflow-visible rounded-[2rem] p-6">
        <div className="flex flex-col gap-2">
          <p className="section-label">Fees</p>
          <h2 className="text-2xl font-black text-[var(--color-heading)]">
            Fee Receipt
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            {canEdit
              ? "Generate fee receipts and download them as PDF."
              : "View your fee receipts and payment details."}
          </p>
        </div>

        {canEdit ? (
          <div className="mt-6 grid overflow-visible gap-4 md:grid-cols-3">
            <FieldLabel label="Student Name">
              <CustomSelect
                value={studentId}
                options={studentOptions}
                onChange={setStudentId}
              />
            </FieldLabel>

            <FieldLabel label="Parent Name">
              <input
                value={parentName}
                onChange={(event) => setParentName(event.target.value)}
                placeholder="Parent name"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Class / Course">
              <input
                value={classCourse}
                onChange={(event) => setClassCourse(event.target.value)}
                placeholder="Example: Class 10 / JEE Foundation"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Batch">
              <input
                value={batch}
                onChange={(event) => setBatch(event.target.value)}
                placeholder="Example: Morning Batch"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Roll No">
              <input
                value={rollNo}
                onChange={(event) => setRollNo(event.target.value)}
                placeholder="Roll no"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Academic Year">
              <input
                value={academicYear}
                onChange={(event) => setAcademicYear(event.target.value)}
                placeholder="2025-26"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Mobile No">
              <input
                value={mobileNo}
                onChange={(event) => setMobileNo(event.target.value)}
                placeholder="Mobile no"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Payment Mode">
              <CustomSelect
                value={paymentMode}
                options={paymentModeOptions}
                onChange={setPaymentMode}
              />
            </FieldLabel>

            <FieldLabel label="Particulars">
              <input
                value={particulars}
                onChange={(event) => setParticulars(event.target.value)}
                placeholder="Example: Monthly Fee"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Month">
              <input
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                placeholder="Example: June 2026"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Total Amount">
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Example: 10000"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Paid Amount">
              <input
                type="number"
                value={paidAmount}
                onChange={(event) => setPaidAmount(event.target.value)}
                placeholder="Example: 10000"
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Due Date">
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={fieldClass}
              />
            </FieldLabel>

            <FieldLabel label="Notes">
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Example: Payment received."
                className={`${fieldClass} min-h-24 md:col-span-2`}
              />
            </FieldLabel>

            <div className="flex items-end">
              <button
                type="button"
                onClick={createInvoice}
                disabled={isSaving || !studentDirectory.length}
                className="action-button w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Generating..." : "Generate Receipt"}
              </button>
            </div>
          </div>
        ) : null}

        {canEdit && !studentDirectory.length ? (
          <p className="mt-4 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm font-semibold text-[var(--color-heading)]">
            No students found. Add students first, then generate receipts.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {invoices.length ? (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="surface overflow-visible rounded-[2rem] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-[var(--color-heading)]">
                    {invoice.receiptNo || invoice.title}
                  </h3>
                  <p className="text-sm text-[var(--color-muted)]">
                    {invoice.studentName} • Due {invoice.dueDate}
                  </p>
                </div>

                <span className="pill">
                  Balance {formatCurrency(getBalance(invoice))}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="surface-soft rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                    Total
                  </p>
                  <p className="mt-1 text-xl font-black text-[var(--color-heading)]">
                    {formatCurrency(invoice.amount)}
                  </p>
                </div>

                <div className="surface-soft rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                    Paid
                  </p>
                  <p className="mt-1 text-xl font-black text-[var(--color-heading)]">
                    {formatCurrency(invoice.paidAmount ?? 0)}
                  </p>
                </div>

                <div className="surface-soft rounded-2xl p-4">
                  <p className="text-xs font-bold uppercase text-[var(--color-muted)]">
                    Balance
                  </p>
                  <p className="mt-1 text-xl font-black text-[var(--color-heading)]">
                    {formatCurrency(getBalance(invoice))}
                  </p>
                </div>
              </div>

              {invoice.notes ? (
                <p className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-muted)]">
                  {invoice.notes}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openReceiptPdf(invoice)}
                  className="rounded-full border border-blue-400/30 bg-blue-500/10 px-5 py-3 text-sm font-black text-blue-600 hover:bg-blue-500/20 dark:text-blue-100"
                >
                  Download Receipt PDF
                </button>

                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => setInvoiceToDelete(invoice)}
                    disabled={deletingId === invoice.id}
                    className="rounded-full border border-red-400/30 bg-red-500/10 px-5 py-3 text-sm font-black text-red-600 hover:bg-red-500/20 disabled:opacity-60 dark:text-red-100"
                  >
                    {deletingId === invoice.id ? "Deleting..." : "Delete"}
                  </button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="surface-soft rounded-[2rem] border border-[var(--color-border)] p-10 text-center lg:col-span-2">
            <h3 className="text-lg font-black text-[var(--color-heading)]">
              No receipts yet
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {canEdit
                ? "Generate the first fee receipt above."
                : "Receipts will appear here once generated by admin or faculty."}
            </p>
          </div>
        )}
      </div>

      {invoiceToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/10 text-2xl">
              ⚠️
            </div>

            <h3 className="mt-5 text-2xl font-black text-[var(--color-heading)]">
              Delete receipt?
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
              Are you sure you want to delete{" "}
              <span className="font-black text-[var(--color-heading)]">
                {invoiceToDelete.receiptNo || invoiceToDelete.title}
              </span>{" "}
              for{" "}
              <span className="font-black text-[var(--color-heading)]">
                {invoiceToDelete.studentName}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <p className="text-sm font-bold text-[var(--color-heading)]">
                Total: {formatCurrency(invoiceToDelete.amount)}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Due date: {invoiceToDelete.dueDate}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                disabled={deletingId === invoiceToDelete.id}
                className="flex-1 rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-black text-[var(--color-heading)] hover:bg-blue-500/10 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => deleteInvoice(invoiceToDelete.id)}
                disabled={deletingId === invoiceToDelete.id}
                className="flex-1 rounded-full border border-red-400/30 bg-red-500 px-5 py-3 text-sm font-black text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === invoiceToDelete.id
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}