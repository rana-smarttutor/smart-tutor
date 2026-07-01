"use client";

import { useState, FormEvent, useMemo } from "react";
import {
  X,
  Clock,
  Laptop,
  CheckCircle,
  BookOpen,
  Calendar,
  Send,
  Sparkles,
  Phone,
  User
} from "@/components/ui-icons";
import { motion, AnimatePresence } from "motion/react";
import { CourseItem } from "@/lib/types";
import { getSuggestibleCourses } from "@/lib/course-library";

interface CourseModalProps {
  course: CourseItem | null;
  onClose: () => void;
}

export default function CourseModal({ course, onClose }: CourseModalProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

  const isYearLong = course?.duration?.toLowerCase().includes("full academic year") ?? false;

  const suggestionOptions = useMemo(() => {
    if (!isYearLong || !course) return [];
    return getSuggestibleCourses()
      .filter((s) => s.standardKey !== course.standardKey)
      .slice(0, 8);
  }, [isYearLong, course]);

  const toggleSuggestion = (standardKey: string) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(standardKey)) {
        next.delete(standardKey);
      } else {
        next.add(standardKey);
      }
      return next;
    });
  };

  if (!course) return null;

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) {
      alert("Please fill out your name and phone/email to continue.");
      return;
    }

    setIsSubmitting(true);
    
    const suggestedCourses = suggestionOptions
      .filter((s) => selectedSuggestions.has(s.standardKey))
      .map((s) => ({ standardKey: s.standardKey, title: s.title }));

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact,
          role,
          courseTitle: course.title,
          courseKey: course.standardKey,
          message: `Hi Smart Tutors, I am interested in joining the course: **${course.title}** (${course.standardKey}) as a ${role}. Let's setup a counseling demo.`,
          suggestedCourses: suggestedCourses.length > 0 ? suggestedCourses : undefined,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        alert("Failed to submit inquiry. Please try again or contact us via WhatsApp.");
      }
    } catch (error) {
      console.error("Enquiry submission error:", error);
      alert("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {course && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ scale: 0.97, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl overflow-hidden shadow-xl relative w-full max-w-4xl max-h-[90vh] flex flex-col z-10 border border-slate-200"
          >
            <div className="p-4 bg-slate-50 text-slate-950 flex justify-between items-center border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    {course.category}
                  </span>
                  <h4 className="font-display font-bold text-xs tracking-tight mt-0.5">Syllabus & Registration Module</h4>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded bg-slate-200/60 text-slate-500 hover:text-slate-900 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 space-y-6">
                <div className="space-y-1.5">
                  <span className="text-xs text-blue-600 font-semibold tracking-wider uppercase block">
                    {course.tagline}
                  </span>
                  <h3 className="font-display font-bold text-xl text-slate-900 tracking-tight leading-tight">
                    {course.title}
                  </h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                    <Clock className="w-4 h-4 text-blue-600 mx-auto" />
                    <span className="text-[9px] text-slate-400 font-bold block uppercase mt-2">Duration</span>
                    <span className="text-xs text-slate-700 font-bold block mt-0.5">{course.duration}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                    <Laptop className="w-4 h-4 text-emerald-600 mx-auto" />
                    <span className="text-[9px] text-slate-400 font-bold block uppercase mt-2">Mode</span>
                    <span className="text-xs text-slate-700 font-bold block mt-0.5 truncate">{course.mode}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                    <Calendar className="w-4 h-4 text-amber-600 mx-auto" />
                    <span className="text-[9px] text-slate-400 font-bold block uppercase mt-2">Schedule</span>
                    <span className="text-xs text-slate-700 font-bold block mt-0.5 truncate">{course.schedule}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                    Syllabus Domains & Chapters Covered:
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {course.subjectsCovered.map((subject) => (
                      <span
                        key={subject}
                        className="bg-blue-50/50 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded border border-blue-100/40 flex items-center shadow-3xs"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                    Core Modules & Outcomes:
                  </h5>
                  <ul className="space-y-2">
                    {course.points.map((point, index) => (
                      <li key={index} className="flex items-start space-x-2 text-slate-500 text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="md:col-span-5 bg-slate-50 border border-slate-200 p-5 rounded-lg flex flex-col justify-between self-start">
                <AnimatePresence mode="wait">
                  {!isSuccess ? (
                    <motion.form
                      key="enquiry-form"
                      onSubmit={handleFormSubmit}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1 pb-3 border-b border-slate-200/60">
                        <h4 className="font-display font-bold text-sm text-slate-900">Book Free Trial Class</h4>
                        <p className="text-slate-500 text-[11px] font-medium leading-normal">
                          Connect with counselors for physical tutoring, study packages, or live classes.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 font-bold block uppercase leading-none">
                            Your Full Name
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="John Doe"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-white text-xs text-slate-800 p-2.5 pl-9 rounded border border-slate-200 focus:outline-hidden focus:border-blue-500 transition-all font-semibold font-sans"
                            />
                            <User className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 font-bold block uppercase leading-none">
                            Phone / Email Address
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="e.g. +91 9876543210"
                              value={contact}
                              onChange={(e) => setContact(e.target.value)}
                              className="w-full bg-white text-xs text-slate-800 p-2.5 pl-9 rounded border border-slate-200 focus:outline-hidden focus:border-blue-500 transition-all font-semibold font-sans"
                            />
                            <Phone className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 font-bold block uppercase leading-none">
                            Enrolling As:
                          </label>
                          <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-white text-xs text-slate-800 p-2.5 rounded border border-slate-200 focus:outline-hidden focus:border-blue-500 transition-all font-semibold font-sans"
                          >
                            <option value="student">Student</option>
                            <option value="parent">Parent / Guardian</option>
                            <option value="corporate">Working Professional</option>
                          </select>
                        </div>
                      </div>

                      {suggestionOptions.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <label className="text-[9px] text-purple-600 font-bold block uppercase leading-none">
                            Also interested in (Optional):
                          </label>
                          <p className="text-[10px] text-slate-400 font-medium leading-snug">
                            Add short-term skill courses alongside your main program
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestionOptions.map((s) => {
                              const isSelected = selectedSuggestions.has(s.standardKey);
                              return (
                                <button
                                  key={s.standardKey}
                                  type="button"
                                  onClick={() => toggleSuggestion(s.standardKey)}
                                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-purple-100 text-purple-800 border-purple-300 shadow-xs"
                                      : "bg-white text-slate-500 border-slate-200 hover:border-purple-200 hover:text-purple-600"
                                  }`}
                                >
                                  {isSelected && <span className="mr-1">✓</span>}
                                  {s.title.length > 35 ? s.title.slice(0, 35) + "..." : s.title}
                                </button>
                              );
                            })}
                          </div>
                          {selectedSuggestions.size > 0 && (
                            <p className="text-[9px] text-purple-500 font-semibold">
                              {selectedSuggestions.size} course{selectedSuggestions.size > 1 ? "s" : ""} selected
                            </p>
                          )}
                        </div>
                      )}

                      <div className="bg-slate-100 p-2.5 rounded border border-slate-200/50 space-y-1">
                        <span className="text-[9px] text-slate-400 font-bold block leading-none">Auto-generated message:</span>
                        <p className="text-slate-500 text-[10px] font-medium leading-normal italic">
                          "Hi Smart Tutors, I am interested in joining the course: **{course.title}** ({course.standardKey}) as a {role}. Let's setup a counseling demo."
                          {selectedSuggestions.size > 0 && (
                            <> Also interested in: {suggestionOptions.filter((s) => selectedSuggestions.has(s.standardKey)).map((s) => s.title).join(", ")}.</>
                          )}
                        </p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2.5 rounded flex items-center justify-center space-x-2 shadow-sm cursor-pointer disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? "Locking Seat..." : "Submit My Details"}</span>
                      </motion.button>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="success-box"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 px-4 space-y-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-display font-bold text-sm text-slate-950">Seat Locked Successfully!</h4>
                        <p className="text-slate-500 text-[11px] font-semibold leading-relaxed">
                          Thank you, <span className="text-blue-600">{name}</span>! Our counselor team will call you within 24 hours on <span className="text-blue-600">{contact}</span> to book your individual free demo session.
                        </p>
                      </div>

                      {selectedSuggestions.size > 0 && (
                        <div className="bg-purple-50 text-purple-700 text-[9px] font-bold p-2 rounded border border-purple-100/50 space-y-1">
                          <span className="block uppercase tracking-wider">Also Selected</span>
                          <span className="block font-semibold">
                            {suggestionOptions.filter((s) => selectedSuggestions.has(s.standardKey)).map((s) => s.title).join(", ")}
                          </span>
                        </div>
                      )}

                      <div className="bg-emerald-50 text-emerald-700 text-[9px] font-bold p-2 rounded border border-emerald-100/50 inline-flex items-center gap-1 uppercase">
                        <Sparkles className="w-3.5 h-3.5" /> Reference: {Math.floor(100000 + Math.random() * 900000)}
                      </div>

                      <center>
                        <button
                          onClick={() => {
                            setIsSuccess(false);
                            setName("");
                            setContact("");
                            setSelectedSuggestions(new Set());
                          }}
                          className="text-[10px] text-slate-400 font-bold hover:text-indigo-600 transition-colors mt-2 uppercase tracking-wide"
                        >
                          Reset / Register another
                        </button>
                      </center>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}