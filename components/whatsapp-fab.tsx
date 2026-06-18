"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WhatsAppFABProps {
  currentCourseTitle?: string | null;
}

export default function WhatsAppFAB({ currentCourseTitle }: WhatsAppFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [typedMsg, setTypedMsg] = useState("");

  const activeCourseLabel = currentCourseTitle || "Professional Academics & Skills";

  const handleSendToWhatsApp = () => {
    const finalMsg = typedMsg.trim()
      ? typedMsg
      : `Hi Smart Tutors, I interested in receiving more information regarding the course: "${activeCourseLabel}". Please connect me with an expert counselor!`;

    const formattedMsg = encodeURIComponent(finalMsg);
    // Standard WhatsApp API link for professional customer support redirects
    const whatsappLink = `https://api.whatsapp.com/send?phone=918850447887&text=${formattedMsg}`;
    window.open(whatsappLink, "_blank");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
      {/* Mini Interactive Help Banner */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="w-80 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          >
            {/* WhatsApp Card Header */}
            <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm">Smart Tutors Help</h4>
                  <span className="text-[10px] text-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 block animate-ping" />
                    Online Counselors available
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-sm bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message input space */}
            <div className="p-4 space-y-3 bg-slate-50">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-3xs text-xs text-slate-500 font-medium">
                <span className="text-emerald-600 font-extrabold text-[10px] tracking-wider uppercase block mb-1">
                  PRE-FILLED SYLLABUS INQUIRY
                </span>
                We can pre-fill information for:
                <span className="font-bold text-slate-800 block mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                  "{activeCourseLabel}"
                </span>
              </div>

              <textarea
                placeholder={`Hi, I'm interested in joining the "${activeCourseLabel}" program. Let's talk.`}
                value={typedMsg}
                onChange={(e) => setTypedMsg(e.target.value)}
                className="w-full bg-white text-xs text-slate-800 p-2.5 rounded border border-slate-200 focus:outline-hidden focus:border-emerald-500 font-medium font-sans h-20 resize-none"
              />

              <button
                onClick={handleSendToWhatsApp}
                className="w-full bg-emerald-600 text-white font-semibold text-xs py-2 rounded flex items-center justify-center space-x-2 shadow-xs hover:bg-emerald-700 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating pulsing WhatsApp Action button exactly mapping specifications */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-all hover:bg-emerald-600 whatsapp-pulse select-none z-5"
        style={{ backgroundColor: "#25D366" }}
      >
        <MessageCircle className="w-7 h-7 text-white fill-white" />
      </button>
    </div>
  );
}
