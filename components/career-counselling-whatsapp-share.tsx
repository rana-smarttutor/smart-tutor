"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCopy,
  MessageCircle,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

type ShareRecord = {
  studentName: string;
  classLevel: string;
  parentName: string;
  parentWhatsapp: string;
  studentPhone: string;
  aiSuggestion: string;
  aiReviewed: boolean;
  whatsappConsent: boolean;
};

type Recipient = "parent" | "student" | "other";

function whatsappPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export function CareerCounsellingWhatsAppShare({
  record,
  onClose,
}: {
  record: ShareRecord;
  onClose: () => void;
}) {
  const [recipient, setRecipient] = useState<Recipient>("parent");

  const [otherPhone, setOtherPhone] = useState("");

  const [openedWhatsApp, setOpenedWhatsApp] = useState(false);

  const [message, setMessage] = useState(
    `Hello,

Greetings from SmartIQ Institute!

The career counselling report for ${record.studentName} has been reviewed and approved.

We are sharing a summary of the career guidance below.

For the complete PDF report, please contact your counsellor.

Regards,
SmartIQ Institute`,
  );

  const selectedNumber =
    recipient === "parent"
      ? record.parentWhatsapp
      : recipient === "student"
        ? record.studentPhone
        : otherPhone;

  const phone = whatsappPhone(selectedNumber);

  const validPhone = /^\d{10,15}$/.test(phone);

  const canShare = record.aiReviewed && record.whatsappConsent && validPhone;

  const shareText = useMemo(
    () =>
      `${message}

Career Guidance Summary:

${record.aiSuggestion.slice(0, 1200)}`,
    [message, record.aiSuggestion],
  );

  function openWhatsApp() {
    if (!canShare) return;

    const url = `https://wa.me/${phone}?text=` + encodeURIComponent(shareText);

    window.open(url, "_blank", "noopener,noreferrer");

    // Opening WhatsApp is not proof of delivery.
    setOpenedWhatsApp(true);
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // Browser clipboard permissions may prevent copying.
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500";

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#F3F6FC]"
      role="dialog"
      aria-modal="true"
      aria-label="Share career report on WhatsApp"
    >
      {/* TOP NAVIGATION */}

      <header className="sticky top-0 z-10 border-b border-blue-100 bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4">
          <div className="text-xl font-black text-[#0B40A1]">
            Smart<span className="text-[#071B46]">IQ</span>
            <span className="ml-2 text-sm font-semibold text-slate-600">
              Institute
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <X size={16} />
            Close
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8">
        <button
          type="button"
          onClick={onClose}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#0B40A1]"
        >
          <ArrowLeft size={16} />
          Back to Career Counselling
        </button>

        <h1 className="text-3xl font-black text-[#091F4A]">
          Share on WhatsApp
        </h1>

        <p className="mb-8 mt-2 text-sm text-slate-600">
          Share the approved career guidance with the student or parent.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT COLUMN */}

          <section className="overflow-hidden rounded-2xl border border-[#D4E0F2] bg-white shadow-sm">
            <div className="p-6 sm:p-7">
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#0B54B7]">
                Student / Parent
              </p>

              <h2 className="mt-2 text-xl font-black text-[#112B60]">
                Share Career Guidance
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Review what you are sending before opening WhatsApp.
              </p>

              <p className="mt-7 text-sm font-bold text-slate-700">
                What would you like to share?
              </p>

              <div className="mt-3 rounded-xl border-2 border-blue-500 bg-[#EFF5FF] p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={22} className="shrink-0 text-blue-700" />

                  <div>
                    <p className="font-black text-blue-950">
                      Approved Career Guidance
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Send the approved counselling summary through WhatsApp.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mb-3 mt-7 text-sm font-bold text-slate-700">
                Select recipient
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["parent", "Parent"],
                    ["student", "Student"],
                    ["other", "Other"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold ${
                      recipient === value
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="career-share-recipient"
                      checked={recipient === value}
                      onChange={() => setRecipient(value)}
                      className="accent-blue-700"
                    />
                    {label}
                  </label>
                ))}
              </div>

              {recipient === "other" && (
                <input
                  value={otherPhone}
                  onChange={(event) => setOtherPhone(event.target.value)}
                  placeholder="Enter number with country code"
                  className={`${inputClass} mt-4`}
                />
              )}

              <div className="mt-4 text-sm text-slate-500">
                Selected number:{" "}
                <strong className="text-slate-800">
                  {validPhone ? `+${phone}` : "Not available"}
                </strong>
              </div>

              <p className="mb-3 mt-7 text-sm font-bold text-slate-700">
                WhatsApp Message Preview
              </p>

              <div className="rounded-xl bg-[#E7F0F3] p-5">
                <div className="max-w-[95%] rounded-xl bg-[#D9F7DC] p-4 text-sm leading-6 text-[#25493D] shadow-sm">
                  <p className="whitespace-pre-wrap">{message}</p>
                </div>

                <p className="mt-3 text-right text-xs text-slate-500">
                  Message preview
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openWhatsApp}
                  disabled={!canShare}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1460D2] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MessageCircle size={17} />
                  Open WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => void copyMessage()}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700"
                >
                  <ClipboardCopy size={16} />
                  Copy Message
                </button>
              </div>

              <p className="mt-5 text-xs leading-5 text-slate-500">
                The message is prepared automatically. You must confirm sending
                inside WhatsApp. A PDF attachment is not automatically uploaded.
              </p>
            </div>
          </section>

          {/* RIGHT COLUMN */}

          <section className="overflow-hidden rounded-2xl border border-[#D4E0F2] bg-white shadow-sm">
            <div className="flex justify-between bg-[#0B204E] px-6 py-4 text-sm font-bold text-white">
              <span>Admissions / Counselling Office</span>
              <span className="text-blue-200">Staff Only</span>
            </div>

            <div className="p-6 sm:p-7">
              <h2 className="text-xl font-black text-[#112B60]">
                Send Career Counselling Report
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Confirm student details and customise the message.
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-500">
                    Student Name
                  </p>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold">
                    {record.studentName}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold text-slate-500">
                    WhatsApp Number
                  </p>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-bold">
                    {validPhone ? `+${phone}` : "Not available"}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold text-slate-500">
                    Class / Level
                  </p>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    {record.classLevel}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold text-slate-500">
                    Report Status
                  </p>

                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                    {record.aiReviewed ? "Approved" : "Pending Review"}
                  </div>
                </div>
              </div>

              <label className="mb-3 mt-7 block text-sm font-bold text-slate-700">
                Edit WhatsApp Message
              </label>

              <textarea
                rows={11}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className={`${inputClass} resize-y leading-6`}
              />

              <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500">
                <ShieldCheck size={17} className="shrink-0 text-blue-700" />
                Sharing requires counsellor approval and recorded WhatsApp
                consent.
              </div>

              {!record.whatsappConsent && (
                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                  WhatsApp sharing consent has not been recorded.
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openWhatsApp}
                  disabled={!canShare}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1460D2] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  <Send size={17} />
                  Send on WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => void copyMessage()}
                  className="rounded-lg border border-blue-200 px-5 py-3 text-sm font-bold text-blue-700"
                >
                  Copy Message
                </button>
              </div>

              <div className="mt-9 border-t border-slate-200 pt-6">
                <h3 className="font-black text-slate-800">
                  Current Share Status
                </h3>

                <div className="mt-4 grid grid-cols-3 gap-3 border-b border-slate-200 pb-3 text-xs font-bold uppercase text-slate-500">
                  <span>Student</span>
                  <span>Recipient</span>
                  <span>Status</span>
                </div>

                <div className="grid grid-cols-3 gap-3 py-4 text-xs text-slate-700">
                  <span>{record.studentName}</span>
                  <span>{recipient}</span>
                  <span>
                    {openedWhatsApp
                      ? "WhatsApp launch requested"
                      : "Not yet opened"}
                  </span>
                </div>

                {openedWhatsApp && (
                  <div className="rounded-lg bg-blue-50 p-4 text-xs font-semibold text-blue-800">
                    WhatsApp launch was requested.
Please check WhatsApp and confirm
the message was sent.
                  </div>
                )}

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Delivery history is not stored by this interface. Automatic
                  attachment and delivery confirmation require a WhatsApp
                  integration.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
