"use client";

import { useState } from "react";

import { ConsultationEnquiryModal } from "@/components/consultation-enquiry-modal";

type ConsultationEnquiryButtonProps = {
  label?: string;
  className?: string;
  source: string;
  requestType?: "consultation" | "demo";
  courseTitle?: string;
  courseKey?: string;
};

export function ConsultationEnquiryButton({
  label = "Book a Consultation",
  className = "",
  source,
  requestType = "consultation",
  courseTitle = "",
  courseKey = "",
}: ConsultationEnquiryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {label}
      </button>

      <ConsultationEnquiryModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        requestType={requestType}
        source={source}
        initialCourseTitle={courseTitle}
        initialCourseKey={courseKey}
      />
    </>
  );
}