"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

type Step = 1 | 2 | 3;
type CounsellorId = "female";

type Counsellor = {
  id: CounsellorId;
  name: string;
  gender: string;
  experience: string;
  image: string;
};

const COUNSELLORS: Counsellor[] = [
  {
    id: "female",
    name: "Mrs.Usha Mam",
    gender: "Female",
    experience: "12 years of experience in counselling and student guidance",
    image: "/images/counsellors/female-counsellor.png",
  },
];

const COUNSELLING_TYPES = [
  {
    value: "Student Counselling",
    description: "Studies, subjects, exam stress and time management.",
  },
  {
    value: "Career Counselling",
    description: "Streams, courses, entrance exams and career choices.",
  },
  {
    value: "Emotional Wellbeing Counselling",
    description: "Personal concerns and emotional support.",
  },
];

const EDUCATION_OPTIONS = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Undergraduate",
  "Graduate",
  "Other",
];

const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass =
  "mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600";

function CounsellorProfile({
  counsellor,
  selected,
  onSelect,
}: {
  counsellor: Counsellor;
  selected: boolean;
  onSelect: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`group w-full overflow-hidden rounded-2xl border-2 bg-white text-left transition-all duration-200 ${
        selected
          ? "border-blue-600 shadow-lg shadow-blue-100"
          : "border-slate-200 hover:border-blue-300 hover:shadow-md"
      }`}
    >
      <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 sm:h-56">
        {!imageFailed ? (
          <Image
            src={counsellor.image}
            alt={`${counsellor.name} profile photograph`}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-contain object-center"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-blue-300">
            <UserRound size={65} strokeWidth={1.2} />
            <span className="text-xs font-semibold text-slate-500">
              Photograph coming soon
            </span>
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full border border-blue-100 bg-white/95 px-3 py-1.5 text-[11px] font-bold text-blue-700 shadow-sm">
          {counsellor.gender} Counsellor
        </span>

        {selected && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
            <Check size={13} />
            Selected
          </span>
        )}
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <div>
          <h4 className="text-lg font-extrabold leading-tight text-slate-900">
            {counsellor.name}
          </h4>
        </div>

        <div className="flex items-start gap-2 border-t border-slate-100 pt-3">
          <BriefcaseBusiness
            size={17}
            className="mt-0.5 shrink-0 text-blue-600"
          />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Experience
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
              {counsellor.experience}
            </p>
          </div>
        </div>

        <div
          className={`rounded-xl px-4 py-3 text-center text-sm font-extrabold transition ${
            selected
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-700 group-hover:bg-blue-100"
          }`}
        >
          {selected ? "Counsellor Selected" : "Select Counsellor"}
        </div>
      </div>
    </button>
  );
}

function CounsellingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Student details
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [education, setEducation] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianContact, setGuardianContact] = useState("");

  // Counselling details
  const [counsellingType, setCounsellingType] = useState("");
  const [concern, setConcern] = useState("");

  // Selected counsellor
  const [selectedCounsellorId, setSelectedCounsellorId] = useState<
    CounsellorId | ""
  >("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const submissionIdRef = useRef("");

  const selectedCounsellor = COUNSELLORS.find(
    (item) => item.id === selectedCounsellorId,
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, submitting]);

  function scrollToTop() {
    scrollRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function goToStep(nextStep: Step) {
    setError("");
    setStep(nextStep);
    scrollToTop();
  }

  function validateStepOne(): string {
    if (!name.trim()) {
      return "Please enter the student's full name.";
    }

    const digits = contact.replace(/\D/g, "");

    if (digits.length < 10 || digits.length > 15) {
      return "Please enter a valid mobile number.";
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!school.trim()) {
      return "Please enter your school or college name.";
    }

    if (!education) {
      return "Please select your class or qualification.";
    }

    if (guardianContact.trim()) {
      const guardianDigits = guardianContact.replace(/\D/g, "");

      if (guardianDigits.length < 10 || guardianDigits.length > 15) {
        return "Please enter a valid guardian contact number.";
      }
    }

    return "";
  }

  function validateStepTwo(): string {
    if (!counsellingType) {
      return "Please select a counselling service.";
    }

    if (concern.trim().length < 10) {
      return "Please describe your concern in at least 10 characters.";
    }

    return "";
  }

  function handleContinue() {
    const validationError = step === 1 ? validateStepOne() : validateStepTwo();

    if (validationError) {
      setError(validationError);
      scrollToTop();
      return;
    }

    goToStep((step + 1) as Step);
  }

  async function submitEnquiry() {
    if (submitting || success) return;

    const validationError = validateStepOne() || validateStepTwo();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedCounsellor) {
      setError("Please select your preferred counsellor.");
      return;
    }

    const message = [
      `School/College: ${school.trim()}`,
      `Class/Qualification: ${education.trim()}`,
      guardianName.trim() ? `Guardian: ${guardianName.trim()}` : "",
      guardianContact.trim()
        ? `Guardian contact: ${guardianContact.trim()}`
        : "",
      `Concern: ${concern.trim()}`,
      `Counsellor gender: ${selectedCounsellor.gender}`,
      `Selected counsellor: ${selectedCounsellor.name}`,
    ]
      .filter(Boolean)
      .join("\n");

    // Matches the existing enquiry API's 500-character limit.
    if (message.length > 500) {
      setError(
        "Your enquiry details are too long. Please shorten your concern or institution name.",
      );
      return;
    }

    if (!submissionIdRef.current) {
      submissionIdRef.current = crypto.randomUUID();
    }

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: submissionIdRef.current,
          name: name.trim(),
          contact: contact.trim(),
          email: email.trim(),
          role: "student",
          courseTitle: counsellingType,
          courseKey: "smartiq-counselling",
          requestType: "consultation",
          source: "homepage-counselling",
          message,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "Unable to submit your counselling enquiry.",
        );
      }

      setSuccess(true);
      scrollToTop();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Submission failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
        {/* Full-screen backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
          onClick={() => {
            if (!submitting) onClose();
          }}
        />

        {/* Modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 15 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="counselling-modal-title"
          className="relative z-10 flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          {/* Header */}
          <header className="shrink-0 border-b border-slate-200 bg-white p-5 sm:px-8 sm:py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <HeartHandshake size={24} />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
                    SmartIQ Institute
                  </p>

                  <h2
                    id="counselling-modal-title"
                    className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl"
                  >
                    Book a Counselling Session
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Three-step counselling enquiry
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                aria-label="Close counselling form"
                className="shrink-0 rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress */}
            {!success && (
              <div className="mt-6 grid grid-cols-3 gap-2">
                {["Your Details", "Your Concern", "Counsellor"].map(
                  (label, index) => {
                    const number = index + 1;
                    const active = step === number;
                    const completed = step > number;

                    return (
                      <div
                        key={label}
                        className={`rounded-xl px-2 py-3 text-center ${
                          active
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-50 text-slate-500"
                        }`}
                      >
                        <div
                          className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            completed
                              ? "bg-emerald-600 text-white"
                              : active
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {completed ? <Check size={15} /> : number}
                        </div>

                        <p className="mt-2 text-[10px] font-bold sm:text-xs">
                          {label}
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </header>

          {/* Scrollable modal body */}
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-8"
          >
            {success ? (
              <div className="py-12 text-center">
                <CheckCircle2 size={64} className="mx-auto text-emerald-600" />

                <h3 className="mt-5 text-2xl font-extrabold text-slate-900">
                  Enquiry Submitted Successfully
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">
                  Thank you, {name}. Your counselling enquiry has been received.
                  Our team will contact you to confirm counsellor availability
                  and the next steps.
                </p>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-7 rounded-xl bg-blue-600 px-8 py-3 font-bold text-white transition hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* STEP 1 */}
                {step === 1 && (
                  <>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">
                        Student Information
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Please enter your basic details.
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="cc-name" className={labelClass}>
                          Full Name *
                        </label>
                        <input
                          id="cc-name"
                          value={name}
                          maxLength={100}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Student's full name"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label htmlFor="cc-phone" className={labelClass}>
                          Mobile Number *
                        </label>
                        <input
                          id="cc-phone"
                          type="tel"
                          value={contact}
                          maxLength={20}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="+91 9876543210"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label htmlFor="cc-email" className={labelClass}>
                          Email Address (Optional)
                        </label>
                        <input
                          id="cc-email"
                          type="email"
                          value={email}
                          maxLength={150}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label htmlFor="cc-school" className={labelClass}>
                          School / College Name *
                        </label>
                        <input
                          id="cc-school"
                          value={school}
                          maxLength={80}
                          onChange={(e) => setSchool(e.target.value)}
                          placeholder="Your institution"
                          className={inputClass}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="cc-class" className={labelClass}>
                          Current Class / Qualification *
                        </label>
                        <select
                          id="cc-class"
                          value={education}
                          onChange={(e) => setEducation(e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select an option</option>

                          {EDUCATION_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="cc-guardian" className={labelClass}>
                          Parent / Guardian Name (Optional)
                        </label>
                        <input
                          id="cc-guardian"
                          value={guardianName}
                          maxLength={60}
                          onChange={(e) => setGuardianName(e.target.value)}
                          placeholder="Parent or guardian"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="cc-guardian-phone"
                          className={labelClass}
                        >
                          Guardian Contact (Optional)
                        </label>
                        <input
                          id="cc-guardian-phone"
                          type="tel"
                          value={guardianContact}
                          maxLength={20}
                          onChange={(e) => setGuardianContact(e.target.value)}
                          placeholder="Guardian mobile number"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">
                        What Would You Like Help With?
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Choose your counselling service and describe what you
                        would like to discuss.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {COUNSELLING_TYPES.map((item) => {
                        const selected = counsellingType === item.value;

                        return (
                          <button
                            key={item.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => {
                              setCounsellingType(item.value);
                              setError("");
                            }}
                            className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                              selected
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                              <GraduationCap size={20} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-900">
                                {item.value}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {item.description}
                              </p>
                            </div>

                            <div
                              className={`h-5 w-5 shrink-0 rounded-full border-2 ${
                                selected
                                  ? "border-blue-600 bg-blue-600 ring-4 ring-blue-100"
                                  : "border-slate-300"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <label htmlFor="cc-concern" className={labelClass}>
                        Describe Your Concern *
                      </label>

                      <textarea
                        id="cc-concern"
                        rows={5}
                        maxLength={200}
                        value={concern}
                        onChange={(e) => setConcern(e.target.value)}
                        placeholder="Briefly describe what you would like to discuss with the counsellor..."
                        className={`${inputClass} resize-y`}
                      />

                      <p className="mt-2 text-right text-xs text-slate-400">
                        {concern.length}/200 characters
                      </p>
                    </div>
                  </>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">
                        Choose Your Counsellor
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        View the available counsellor profiles and select the
                        person you would prefer to speak with.
                      </p>
                    </div>

                    <div className="mx-auto w-full max-w-[350px]">
                      {COUNSELLORS.map((counsellor) => (
                        <CounsellorProfile
                          key={counsellor.id}
                          counsellor={counsellor}
                          selected={selectedCounsellorId === counsellor.id}
                          onSelect={() => {
                            setSelectedCounsellorId(counsellor.id);
                            setError("");
                          }}
                        />
                      ))}
                    </div>

                    {/* Review */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <h4 className="text-base font-extrabold text-slate-900">
                        Review Your Counselling Enquiry
                      </h4>

                      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-slate-500">Student Name</p>
                          <p className="mt-1 font-bold text-slate-900">
                            {name}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Contact Number
                          </p>
                          <p className="mt-1 font-bold text-slate-900">
                            {contact}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            School / College
                          </p>
                          <p className="mt-1 font-bold text-slate-900">
                            {school}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Class / Qualification
                          </p>
                          <p className="mt-1 font-bold text-slate-900">
                            {education}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Counselling Type
                          </p>
                          <p className="mt-1 font-bold text-slate-900">
                            {counsellingType}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Preferred Counsellor
                          </p>
                          <p className="mt-1 font-bold text-blue-700">
                            {selectedCounsellor?.name || "Not selected"}
                          </p>
                        </div>

                        <div className="sm:col-span-2">
                          <p className="text-xs text-slate-500">Your Concern</p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-slate-700">
                            {concern}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Validation error */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
                  >
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:px-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep((step - 1) as Step)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              ) : (
                <span className="text-xs text-slate-500">Step 1 of 3</span>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void submitEnquiry()}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  <Send size={16} />
                  {submitting ? "Submitting..." : "Submit Enquiry"}
                </button>
              )}
            </footer>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function HomeCounsellingBooking({
  className = "",
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Book Now ↗
      </button>

      {mounted &&
        open &&
        createPortal(
          <CounsellingModal onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  );
}
