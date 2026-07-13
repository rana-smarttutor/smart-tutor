"use client";

import React from "react";
import { CheckCircle2, Printer } from "lucide-react";

export default function FeeReceipt() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-200 p-4 sm:p-8 font-sans flex flex-col items-center">
      {/* Print Button (Hidden when printing) */}
      <button
        onClick={handlePrint}
        className="mb-6 flex items-center gap-2 px-6 py-2 bg-[#00072d] text-white rounded-lg shadow-md hover:bg-[#000525] transition-colors print:hidden"
      >
        <Printer size={18} />
        Print Receipt
      </button>

      {/* Receipt Container */}
      <div
        className="bg-white text-gray-900 w-full max-w-[850px] shadow-2xl print:shadow-none print:w-full print:max-w-none"
        style={{
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {/* Inner Border */}
        <div className="border-[1.5px] border-slate-700 m-2 sm:m-4 p-4 sm:p-6 flex flex-col">
          {/* HEADER: Logo fills width until address section */}
          <div className="w-full border-b-[1.5px] border-slate-700 pb-4 mb-4">
            <div className="flex items-stretch gap-0">
              {/* Logo — fills available width */}
              <div className="flex-1 flex items-center justify-center pr-4 border-r border-slate-300">
                <img
                  src="/stpl.jpeg"
                  alt="Smart Tutors"
                  className="w-full h-auto max-h-[120px] object-contain"
                />
              </div>
              {/* Address Section */}
              <div className="flex flex-col justify-center pl-4 text-right min-w-[220px]">
                <div className="text-[13px] font-bold text-[#00072d]">
                  Smart Tutors
                </div>
                <div className="text-[11px] leading-relaxed text-gray-600 mt-1">
                  Plot No. 2, Second Floor, Vashi Plaza,
                  <br />
                  Sector 17, Vashi, Navi Mumbai – 400703
                  <br />
                  <span className="text-gray-500">
                    info@smarttutors.co.in | +91 88504 47887
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold text-center text-[#00072d] tracking-wide mb-6">
            FEE RECEIPT
          </h1>

          {/* Top Meta Info */}
          <div className="flex justify-between text-[13px] font-bold text-gray-800 mb-2 px-1">
            <div className="flex">
              <span className="w-24">Receipt No.</span>
              <span className="mr-2">:</span>
              <span>ST-REC-2026-005</span>
            </div>
            <div className="flex">
              <span className="w-24">Receipt Date</span>
              <span className="mr-2">:</span>
              <span>13-07-2026</span>
            </div>
          </div>

          {/* STUDENT DETAILS SECTION */}
          <SectionHeader title="STUDENT DETAILS" />
          <div className="border border-slate-400 text-[13px] mb-6 flex flex-col">
            {/* Row 1 */}
            <div className="flex border-b border-slate-400">
              <div className="flex-1 flex px-3 py-2 border-r border-slate-400 bg-white">
                <span className="w-28 font-bold">Student Name</span>
                <span className="mr-2">:</span>
                <span className="flex-1 text-gray-700">
                  Aaradhya Vivekanand Mokal
                </span>
              </div>
              <div className="flex-1 flex px-3 py-2 bg-white">
                <span className="w-28 font-bold">Parent Name</span>
                <span className="mr-2">:</span>
                <span className="flex-1 text-gray-700">Archana Mokal</span>
              </div>
            </div>
            {/* Row 2 */}
            <div className="flex border-b border-slate-400">
              <div className="flex-1 flex px-3 py-2 border-r border-slate-400 bg-white">
                <span className="w-28 font-bold">Class / Board</span>
                <span className="mr-2">:</span>
                <span className="flex-1 text-gray-700">Class 9 | CBSE</span>
              </div>
              <div className="flex-1 flex px-3 py-2 bg-white">
                <span className="w-28 font-bold">Enrolment Date</span>
                <span className="mr-2">:</span>
                <span className="flex-1 text-gray-700">05-07-2026</span>
              </div>
            </div>
            {/* Row 3 */}
            <div className="flex border-b border-slate-400">
              <div className="flex-1 flex px-3 py-2 border-r border-slate-400 bg-white">
                <span className="w-28 font-bold">Enrolment No.</span>
                <span className="mr-2">:</span>
                <span className="flex-1 text-gray-700">STU-2026-0005</span>
              </div>
              <div className="flex-1 flex px-3 py-2 bg-white">
                <span className="w-28 font-bold">Academic Year</span>
                <span className="mr-2">:</span>
                <span className="flex-1 text-gray-700">2026-27</span>
              </div>
            </div>
            {/* Row 4 */}
            <div className="flex">
              <div className="flex-1 flex px-3 py-2 border-r border-slate-400 bg-white">
                <span className="w-28 font-bold">Mobile No.</span>
                <span className="mr-2">:</span>
                <span className="flex-1 text-gray-700">9324827172</span>
              </div>
              <div className="flex-1 flex px-3 py-2 bg-white">
                <span className="w-28 font-bold">Payment Mode</span>
                <span className="mr-2">:</span>
                <span className="flex-1 text-gray-700">UPI</span>
              </div>
            </div>
          </div>

          {/* FEE DETAILS SECTION */}
          <SectionHeader title="FEE DETAILS" />
          <table className="w-full border-collapse border border-slate-400 text-[13px] mb-4 text-center">
            <thead>
              <tr className="bg-[#00072d] text-white">
                <th className="border border-slate-400 py-1.5 px-2 font-medium">
                  Sr No.
                </th>
                <th className="border border-slate-400 py-1.5 px-2 font-medium text-left">
                  Particulars
                </th>
                <th className="border border-slate-400 py-1.5 px-2 font-medium">
                  Month
                </th>
                <th className="border border-slate-400 py-1.5 px-2 font-medium">
                  Due Date
                </th>
                <th className="border border-slate-400 py-1.5 px-2 font-medium">
                  Amount (₹)
                </th>
                <th className="border border-slate-400 py-1.5 px-2 font-medium">
                  Paid (₹)
                </th>
                <th className="border border-slate-400 py-1.5 px-2 font-medium">
                  Balance (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-400 py-3 px-2">1</td>
                <td className="border border-slate-400 py-3 px-2 text-left font-medium">
                  Monthly Tuition Fee
                </td>
                <td className="border border-slate-400 py-3 px-2">July 2026</td>
                <td className="border border-slate-400 py-3 px-2">
                  31-07-2026
                </td>
                <td className="border border-slate-400 py-3 px-2">14,000</td>
                <td className="border border-slate-400 py-3 px-2">10,000</td>
                <td className="border border-slate-400 py-3 px-2">4,000</td>
              </tr>
            </tbody>
          </table>

          {/* Amount in words */}
          <div className="flex text-[13px] font-bold px-1 mb-5">
            <span className="w-[120px]">Amount in Words</span>
            <span className="mr-2">:</span>
            <span className="text-gray-700 font-normal">
              Fourteen Thousand Rupees Only
            </span>
          </div>

          <hr className="border-t-[1.5px] border-slate-700 mb-4" />

          {/* PAYMENT SUMMARY INFO */}
          <div className="px-1 text-[13px] font-bold text-gray-800 mb-6">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <span className="w-[120px]">Payment Status</span>
                <span className="mr-2">:</span>
                <span className="text-[#15803d] flex items-center gap-1 text-sm bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  <CheckCircle2
                    size={16}
                    strokeWidth={3}
                    className="text-[#15803d]"
                  />
                  PAID
                </span>
              </div>
              <div className="flex">
                <span>Total Paid</span>
                <span className="mx-2">:</span>
                <span>₹10,000</span>
              </div>
              <div className="flex">
                <span>Balance Due</span>
                <span className="mx-2">:</span>
                <span>₹4,000</span>
              </div>
            </div>

            <div className="flex items-center font-bold text-gray-800">
              <span className="w-[120px]">Due Date</span>
              <span className="mr-2">:</span>
              <span className="text-gray-700 font-normal mr-4">
                31-07-2026
              </span>
              <span className="border-l border-gray-400 h-4 mr-4"></span>
              <span className="mr-2">Print Date</span>
              <span className="mr-2">:</span>
              <span className="text-gray-700 font-normal">
                13-07-2026, 06:01:38 PM
              </span>
            </div>
          </div>

          {/* PAYMENT HISTORY SECTION */}
          <SectionHeader title="PAYMENT HISTORY" />
          <table className="w-full border-collapse border border-slate-400 text-[13px] mb-12 text-center">
            <thead>
              <tr className="bg-gray-100 text-gray-900 border-b border-slate-400">
                <th className="border border-slate-400 py-1.5 px-2 font-bold">
                  #
                </th>
                <th className="border border-slate-400 py-1.5 px-2 font-bold">
                  Date
                </th>
                <th className="border border-slate-400 py-1.5 px-2 font-bold">
                  Amount (₹)
                </th>
                <th className="border border-slate-400 py-1.5 px-2 font-bold">
                  Mode
                </th>
                <th className="border border-slate-400 py-1.5 px-2 font-bold">
                  Transaction Ref
                </th>
                <th className="border border-slate-400 py-1.5 px-2 font-bold">
                  Bank
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-400 py-2 px-2">1</td>
                <td className="border border-slate-400 py-2 px-2">
                  05-07-2026
                </td>
                <td className="border border-slate-400 py-2 px-2">10,000</td>
                <td className="border border-slate-400 py-2 px-2">UPI</td>
                <td className="border border-slate-400 py-2 px-2">
                  758027001866
                </td>
                <td className="border border-slate-400 py-2 px-2">
                  Axis Bank
                </td>
              </tr>
            </tbody>
          </table>

          {/* SIGNATURE AND FOOTER */}
          <div className="mt-auto flex justify-end mb-8 px-4">
            <div className="flex flex-col items-center">
              <div
                className="text-4xl text-gray-800 mb-1"
                style={{
                  fontFamily:
                    "'Brush Script MT', 'Caveat', 'Great Vibes', cursive",
                }}
              >
                Ravi Rana
              </div>
              <div className="w-48 border-t-[1.5px] border-slate-800 mb-1"></div>
              <div className="text-[14px] font-bold text-gray-900">
                Mr. Ravi Rana
              </div>
              <div className="text-[12px] text-gray-700">
                Director & Founder
              </div>
            </div>
          </div>

          {/* Terms / Bottom Notes */}
          <div className="flex justify-between items-end text-[10px] text-gray-600 px-1 mt-4">
            <div className="flex flex-col gap-0.5">
              <p>
                This is a computer generated receipt and does not require
                signature.
              </p>
              <p>Fees are not refundable at any circumstances.</p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <p>Thank you for choosing Smart Tutors Pvt. Ltd.</p>
              <p>We appreciate your trust.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helper component for section titles */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-[#00072d] text-white py-1.5 px-3 font-semibold text-[13px] uppercase tracking-wide mb-3">
      {title}
    </div>
  );
}
