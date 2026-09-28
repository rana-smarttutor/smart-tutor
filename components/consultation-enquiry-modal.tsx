"use client";

import { type FormEvent, useEffect, useState } from "react";

import { createPortal } from "react-dom";

type RequestType = "consultation" | "demo";

type ConsultationEnquiryModalProps = {
  open: boolean;
  onClose: () => void;
  requestType?: RequestType;
  source: string;
  initialCourseTitle?: string;
  initialCourseKey?: string;
};

function getModalCopy(requestType: RequestType) {
  if (requestType === "demo") {
    return {
      eyebrow: "Demo Request",
      title: "Book a Demo",
      description:
        "Share your details and our team will contact you to schedule your demo.",
      submitLabel: "Submit Demo Request",
      successTitle: "Demo request received",
      successMessage:
        "Thank you. Our team will contact you shortly to arrange your demo.",
    };
  }

  return {
    eyebrow: "Student Enquiry",
    title: "Book a Consultation",
    description:
      "Tell us what you are looking for and our academic team will help you choose the right learning path.",
    submitLabel: "Submit Consultation Request",
    successTitle: "Consultation request received",
    successMessage: "Thank you. Our academic team will contact you shortly.",
  };
}

export function ConsultationEnquiryModal({
  open,
  onClose,
  requestType = "consultation",
  source,
  initialCourseTitle = "",
  initialCourseKey = "",
}: ConsultationEnquiryModalProps) {
  const copy = getModalCopy(requestType);

  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState("");

  const [contact, setContact] = useState("");

  const [email, setEmail] = useState("");

  const [courseTitle, setCourseTitle] = useState(initialCourseTitle);

  const [branch, setBranch] = useState("");

  const [preferredDate, setPreferredDate] = useState("");

  const [preferredTime, setPreferredTime] = useState("");

  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCourseTitle(initialCourseTitle);

    setError("");
    setSubmitted(false);
  }, [open, initialCourseTitle]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isSubmitting, onClose]);

  if (!mounted || !open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    const trimmedContact = contact.trim();

    const trimmedEmail = email.trim();

    const trimmedCourse = courseTitle.trim();

    if (!trimmedName) {
      setError("Please enter your full name.");

      return;
    }

    if (!trimmedContact) {
      setError("Please enter your mobile number.");

      return;
    }

    const contactDigits = trimmedContact.replace(/\D/g, "");

    if (contactDigits.length < 7) {
      setError("Please enter a valid mobile number.");

      return;
    }

    if (!trimmedCourse) {
      setError("Please enter the course or program you are interested in.");

      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");

      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: trimmedName,

          contact: trimmedContact,

          email: trimmedEmail,

          role: "student",

          courseTitle: trimmedCourse,

          courseKey: initialCourseKey,

          branch,

          preferredDate,

          preferredTime,

          message: message.trim(),

          requestType,

          source,

          suggestedCourses: [],
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to submit your request.");
      }

      setSubmitted(true);

      setName("");
      setContact("");
      setEmail("");
      setBranch("");
      setPreferredDate("");
      setPreferredTime("");
      setMessage("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to submit your request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const modal = (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        overflow-y-auto
        bg-slate-950/60
        p-3
        backdrop-blur-sm
        sm:p-4
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="consultation-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="
          relative
          my-auto
          flex
          w-full
          max-w-2xl
          flex-col
          overflow-hidden
          rounded-[24px]
          border
          border-slate-200
          bg-white
          shadow-2xl
          sm:rounded-[30px]
        "
        style={{
          maxHeight: "calc(100dvh - 24px)",
          transform: "none",
          zoom: 1,
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        {/* HEADER */}
        <div
          className="
            relative
            shrink-0
            border-b
            border-slate-100
            bg-gradient-to-br
            from-blue-50
            via-white
            to-indigo-50
            px-5
            py-5
            sm:px-7
            sm:py-6
          "
        >
          <button
            type="button"
            aria-label="Close enquiry form"
            disabled={isSubmitting}
            onClick={onClose}
            className="
              absolute
              right-4
              top-4
              z-10
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              border
              border-slate-200
              bg-white
              text-lg
              font-bold
              text-slate-500
              shadow-sm
              transition
              hover:bg-slate-100
              hover:text-slate-900
              disabled:opacity-50
              sm:right-5
              sm:top-5
              sm:h-10
              sm:w-10
            "
          >
            ×
          </button>

          <p
            className="
              pr-12
              text-[10px]
              font-black
              uppercase
              tracking-[0.22em]
              text-blue-600
              sm:text-[11px]
            "
          >
            {copy.eyebrow}
          </p>

          <h2
            id="consultation-modal-title"
            className="
              mt-2
              pr-12
              text-2xl
              font-black
              leading-tight
              tracking-tight
              text-slate-950
              sm:text-3xl
            "
          >
            {copy.title}
          </h2>

          <p
            className="
              mt-2
              max-w-xl
              pr-8
              text-xs
              font-medium
              leading-5
              text-slate-500
              sm:mt-3
              sm:text-sm
              sm:leading-6
            "
          >
            {copy.description}
          </p>
        </div>

        {submitted ? (
          <div
            className="
              flex
              min-h-[320px]
              flex-col
              items-center
              justify-center
              overflow-y-auto
              px-5
              py-10
              text-center
              sm:px-8
            "
          >
            <div
              className="
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                bg-emerald-100
                text-3xl
                text-emerald-700
              "
            >
              ✓
            </div>

            <h3
              className="
                mt-5
                text-2xl
                font-black
                text-slate-950
              "
            >
              {copy.successTitle}
            </h3>

            <p
              className="
                mx-auto
                mt-3
                max-w-md
                text-sm
                leading-6
                text-slate-500
              "
            >
              {copy.successMessage}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="
                mt-7
                rounded-xl
                bg-blue-600
                px-7
                py-3
                text-sm
                font-bold
                text-white
                transition
                hover:bg-blue-700
              "
            >
              Close
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="
              flex
              min-h-0
              flex-1
              flex-col
            "
          >
            {/* FORM AREA */}
            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                overscroll-contain
                px-5
                py-5
                sm:px-7
                sm:py-6
              "
            >
              <div
                className="
                  space-y-4
                  sm:space-y-5
                "
              >
                {/* NAME + MOBILE */}
                <div
                  className="
                    grid
                    grid-cols-1
                    gap-4
                    sm:grid-cols-2
                    sm:gap-5
                  "
                >
                  <label className="min-w-0 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Full Name *
                    </span>

                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={100}
                      required
                      autoComplete="name"
                      placeholder="Enter your full name"
                      style={{
                        fontSize: "16px",
                      }}
                      className="
                        h-12
                        w-full
                        min-w-0
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        font-semibold
                        text-slate-900
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    />
                  </label>

                  <label className="min-w-0 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Mobile Number *
                    </span>

                    <input
                      value={contact}
                      onChange={(event) => setContact(event.target.value)}
                      maxLength={30}
                      required
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="Enter mobile number"
                      style={{
                        fontSize: "16px",
                      }}
                      className="
                        h-12
                        w-full
                        min-w-0
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        font-semibold
                        text-slate-900
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    />
                  </label>
                </div>

                {/* EMAIL + BRANCH */}
                <div
                  className="
                    grid
                    grid-cols-1
                    gap-4
                    sm:grid-cols-2
                    sm:gap-5
                  "
                >
                  <label className="min-w-0 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Email
                    </span>

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      maxLength={150}
                      autoComplete="email"
                      placeholder="you@example.com"
                      style={{
                        fontSize: "16px",
                      }}
                      className="
                        h-12
                        w-full
                        min-w-0
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        font-semibold
                        text-slate-900
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    />
                  </label>

                  <label className="min-w-0 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Branch
                    </span>

                    <select
                      value={branch}
                      onChange={(event) => setBranch(event.target.value)}
                      style={{
                        fontSize: "16px",
                      }}
                      className="
                        h-12
                        w-full
                        min-w-0
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        font-semibold
                        text-slate-900
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    >
                      <option value="">Select branch</option>

                      <option value="Vashi">Vashi</option>

                      <option value="Panvel">Panvel</option>

                      <option value="Online">Online</option>

                      <option value="Not sure">Not sure yet</option>
                    </select>
                  </label>
                </div>

                {/* COURSE */}
                <label className="block min-w-0 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Course / Program Interested In *
                  </span>

                  <input
                    value={courseTitle}
                    onChange={(event) => setCourseTitle(event.target.value)}
                    maxLength={200}
                    required
                    placeholder="Example: Class 10, JEE, SSC, Spoken English"
                    style={{
                      fontSize: "16px",
                    }}
                    className="
                      h-12
                      w-full
                      min-w-0
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      font-semibold
                      text-slate-900
                      outline-none
                      transition
                      placeholder:text-slate-400
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                    "
                  />
                </label>

                {/* DATE + TIME */}
                <div
                  className="
                    grid
                    grid-cols-1
                    gap-4
                    sm:grid-cols-2
                    sm:gap-5
                  "
                >
                  <label className="min-w-0 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Preferred Date
                    </span>

                    <input
                      type="date"
                      value={preferredDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(event) => setPreferredDate(event.target.value)}
                      style={{
                        fontSize: "16px",
                      }}
                      className="
                        h-12
                        w-full
                        min-w-0
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        font-semibold
                        text-slate-900
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    />
                  </label>

                  <label className="min-w-0 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Preferred Time
                    </span>

                    <input
                      type="time"
                      value={preferredTime}
                      onChange={(event) => setPreferredTime(event.target.value)}
                      style={{
                        fontSize: "16px",
                      }}
                      className="
                        h-12
                        w-full
                        min-w-0
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        font-semibold
                        text-slate-900
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    />
                  </label>
                </div>

                {/* MESSAGE */}
                <label className="block min-w-0 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Message
                  </span>

                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={500}
                    rows={4}
                    placeholder="Tell us what help you need..."
                    style={{
                      fontSize: "16px",
                    }}
                    className="
                      w-full
                      min-w-0
                      resize-none
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      py-3
                      font-semibold
                      text-slate-900
                      outline-none
                      transition
                      placeholder:text-slate-400
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                    "
                  />
                </label>

                {error ? (
                  <div
                    className="
                      rounded-xl
                      border
                      border-red-200
                      bg-red-50
                      px-4
                      py-3
                      text-sm
                      font-semibold
                      text-red-700
                    "
                  >
                    {error}
                  </div>
                ) : null}
              </div>
            </div>

            {/* FOOTER */}
            <div
              className="
                shrink-0
                border-t
                border-slate-100
                bg-white
                px-5
                py-4
                sm:px-7
              "
            >
              <div
                className="
                  flex
                  flex-col-reverse
                  gap-3
                  sm:flex-row
                  sm:justify-end
                "
              >
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="
                    h-11
                    rounded-xl
                    border
                    border-slate-200
                    px-6
                    text-sm
                    font-bold
                    text-slate-700
                    transition
                    hover:bg-slate-50
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="
                    min-h-11
                    rounded-xl
                    bg-blue-600
                    px-6
                    py-3
                    text-sm
                    font-black
                    text-white
                    shadow-lg
                    shadow-blue-600/20
                    transition
                    hover:bg-blue-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {isSubmitting ? "Submitting..." : copy.submitLabel}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
