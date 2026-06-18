"use client";

import { useState } from "react";
import ToppersSection from "./toppers-section";
import { BookOpen, School, FlaskConical, Layers, FileText, Brain } from "lucide-react";

export default function HomeToppers() {
  const [activeTab, setActiveTab] = useState("Class 11-12");

  const tabs = [
    { id: "Class 6-8", label: "School", icon: BookOpen },
    { id: "Class 11-12", label: "College", icon: FlaskConical },
    { id: "Graduation", label: "Graduation", icon: Layers },
    { id: "Govt Exams", label: "Govt Exams", icon: FileText },
    { id: "Skills", label: "Skills", icon: Brain },
  ];

  return (
    <section className="section-shell py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        <ToppersSection activeTab={activeTab} />
      </div>
    </section>
  );
}
