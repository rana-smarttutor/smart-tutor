import "server-only";

import { unstable_cache } from "next/cache";

import * as cheerio from "cheerio";

export type ExamUpdateType =
  | "Result"
  | "Admit Card"
  | "Answer Key"
  | "Application"
  | "Exam Date"
  | "Recruitment"
  | "Notification";

export type ExamCategory =
  | "Board Exams"
  | "Government Exams"
  | "Competitive Exams";

export type ExamUpdate = {
  id: string;

  title: string;

  source: string;

  sourceKey: string;

  category: ExamCategory;

  type: ExamUpdateType;

  officialUrl: string;

  publishedLabel?: string;
};

type ExamSource = {
  key: string;

  name: string;

  category: ExamCategory;

  url: string;

  allowedHosts: string[];

  maxItems: number;

  includeKeywords?: string[];

  excludeKeywords?: string[];

  /*

   * Dedicated single-exam/recruitment websites can accept

   * their own source-specific keywords without also requiring

   * one of the generic English Exam Updates keywords.

   *

   * Useful for sources such as Maharashtra Police where

   * many notices are published in Marathi.

   */

  sourceKeywordOnly?: boolean;
};

const SOURCES: ExamSource[] = [
  // =====================================================

  // BOARD EXAMS

  // =====================================================

  {
    key: "cbse",

    name: "CBSE",

    category: "Board Exams",

    url: "https://www.cbse.gov.in/cbsenew/examination_Circular.html",

    allowedHosts: ["cbse.gov.in"],

    maxItems: 35,
  },

  {
    key: "cisce",

    name: "CISCE / ICSE / ISC",

    category: "Board Exams",

    url: "https://cisce.org/",

    allowedHosts: ["cisce.org"],

    maxItems: 30,
  },

  {
    key: "maharashtra-board",

    name: "Maharashtra SSC / HSC",

    category: "Board Exams",

    url: "https://mahahsscboard.in/en",

    allowedHosts: ["mahahsscboard.in"],

    maxItems: 30,
  },

  {
    key: "nios",

    name: "NIOS",

    category: "Board Exams",

    url: "https://sdmis.nios.ac.in/registration/home-notifications",

    allowedHosts: [
      "nios.ac.in",

      "sdmis.nios.ac.in",

      "exams.nios.ac.in",

      "sdmis.s3.ap-south-1.amazonaws.com",
    ],

    maxItems: 35,
  },

  // =====================================================

  // GOVERNMENT EXAMS

  // =====================================================

  {
    key: "ssc",

    name: "SSC",

    category: "Government Exams",

    url: "https://ssc.gov.in/",

    allowedHosts: ["ssc.gov.in"],

    maxItems: 40,
  },

  {
    key: "nda",

    name: "NDA / Naval Academy",

    category: "Government Exams",

    url: "https://www.upsc.gov.in/whats-new",

    allowedHosts: ["upsc.gov.in", "upsconline.nic.in"],

    maxItems: 30,

    includeKeywords: ["national defence academy", "naval academy", "nda"],
  },

  {
    key: "cds",

    name: "Combined Defence Services (CDS)",

    category: "Government Exams",

    url: "https://www.upsc.gov.in/whats-new",

    allowedHosts: ["upsc.gov.in", "upsconline.nic.in"],

    maxItems: 30,

    includeKeywords: ["combined defence services", "cds"],
  },

  {
    key: "upsc",

    name: "UPSC",

    category: "Government Exams",

    url: "https://www.upsc.gov.in/whats-new",

    allowedHosts: ["upsc.gov.in", "upsconline.nic.in"],

    maxItems: 40,

    /*

     * NDA and CDS are handled by their own source cards above.

     */

    excludeKeywords: [
      "national defence academy",

      "naval academy",

      "combined defence services",
    ],
  },

  {
    key: "mpsc",

    name: "MPSC",

    category: "Government Exams",

    url: "https://mpsc.gov.in/",

    allowedHosts: ["mpsc.gov.in"],

    maxItems: 35,
  },

  // =====================================================

  // BANKING — COMMON EXAM AUTHORITY

  // =====================================================

  {
    key: "ibps",

    name: "IBPS Banking",

    category: "Government Exams",

    url: "https://www.ibps.in/",

    allowedHosts: ["ibps.in", "ibpsreg.ibps.in", "ibpsonline.ibps.in"],

    maxItems: 50,
  },

  // =====================================================

  // STATE BANK OF INDIA

  // =====================================================

  {
    key: "sbi-recruitment",

    name: "SBI Recruitment",

    category: "Government Exams",

    url: "https://sbi.co.in/web/careers/current-openings",

    allowedHosts: ["sbi.co.in", "ibpsonline.ibps.in"],

    maxItems: 40,
  },

  // =====================================================

  // RESERVE BANK OF INDIA

  // =====================================================

  {
    key: "rbi-recruitment",

    name: "RBI Recruitment",

    category: "Government Exams",

    url: "https://opportunities.rbi.org.in/Scripts/Vacancies.aspx",

    allowedHosts: ["rbi.org.in", "opportunities.rbi.org.in"],

    maxItems: 40,
  },

  // =====================================================

  // CANARA BANK

  // =====================================================

  {
    key: "canara-bank",

    name: "Canara Bank",

    category: "Government Exams",

    url: "https://www.canarabank.bank.in/pages/recruitment",

    allowedHosts: [
      "canarabank.bank.in",

      "canarabank.com",

      "ibpsonline.ibps.in",

      "ibps.in",
    ],

    maxItems: 40,
  },

  // =====================================================

  // BANK OF INDIA

  // =====================================================

  {
    key: "bank-of-india",

    name: "Bank of India",

    category: "Government Exams",

    url: "https://bankofindia.co.in/career",

    allowedHosts: ["bankofindia.co.in", "ibpsonline.ibps.in", "ibps.in"],

    maxItems: 40,
  },

  // =====================================================

  // BANK OF BARODA

  // =====================================================

  {
    key: "bank-of-baroda",

    name: "Bank of Baroda",

    category: "Government Exams",

    url: "https://www.bankofbaroda.in/career/current-opportunities",

    allowedHosts: [
      "bankofbaroda.in",

      "bankofbaroda.co.in",

      "ibpsonline.ibps.in",

      "ibps.in",
    ],

    maxItems: 40,
  },

  // =====================================================

  // PUNJAB NATIONAL BANK

  // =====================================================

  {
    key: "pnb",

    name: "Punjab National Bank",

    category: "Government Exams",

    url: "https://www.pnbindia.in/recruitments.aspx",

    allowedHosts: ["pnbindia.in", "ibpsonline.ibps.in", "ibps.in"],

    maxItems: 40,
  },

  // =====================================================

  // UNION BANK OF INDIA

  // =====================================================

  {
    key: "union-bank",

    name: "Union Bank of India",

    category: "Government Exams",

    url: "https://www.unionbankofindia.bank.in/en/common/recruitment",

    allowedHosts: [
      "unionbankofindia.bank.in",

      "unionbankofindia.co.in",

      "ibpsonline.ibps.in",

      "ibps.in",
    ],

    maxItems: 40,
  },

  // =====================================================

  // INDIAN BANK

  // =====================================================

  {
    key: "indian-bank",

    name: "Indian Bank",

    category: "Government Exams",

    url: "https://www.indianbank.in/career/",

    allowedHosts: ["indianbank.in", "ibpsonline.ibps.in", "ibps.in"],

    maxItems: 40,
  },

  // =====================================================

  // CENTRAL BANK OF INDIA

  // =====================================================

  {
    key: "central-bank-india",

    name: "Central Bank of India",

    category: "Government Exams",

    url: "https://centralbank.bank.in/en/recruitments",

    allowedHosts: [
      "centralbank.bank.in",

      "centralbankofindia.co.in",

      "ibpsonline.ibps.in",

      "ibps.in",
    ],

    maxItems: 40,
  },

  // =====================================================

  // INDIAN OVERSEAS BANK

  // =====================================================

  {
    key: "indian-overseas-bank",

    name: "Indian Overseas Bank",

    category: "Government Exams",

    url: "https://www.iob.in/Careers",

    allowedHosts: ["iob.in", "ibpsonline.ibps.in", "ibps.in"],

    maxItems: 40,
  },

  // =====================================================

  // UCO BANK

  // =====================================================

  {
    key: "uco-bank",

    name: "UCO Bank",

    category: "Government Exams",

    url: "https://www.uco.bank.in/web/guest/job-opportunities",

    allowedHosts: [
      "uco.bank.in",

      "ucobank.com",

      "ibpsonline.ibps.in",

      "ibps.in",
    ],

    maxItems: 40,
  },

  // =====================================================

  // BANK OF MAHARASHTRA

  // =====================================================

  {
    key: "bank-of-maharashtra",

    name: "Bank of Maharashtra",

    category: "Government Exams",

    url: "https://bankofmaharashtra.in/current-openings",

    allowedHosts: ["bankofmaharashtra.in", "ibpsonline.ibps.in", "ibps.in"],

    maxItems: 40,
  },

  // =====================================================

  // PUNJAB & SIND BANK

  // =====================================================

  {
    key: "punjab-sind-bank",

    name: "Punjab & Sind Bank",

    category: "Government Exams",

    url: "https://punjabandsindbank.co.in/content/recuitment",

    allowedHosts: ["punjabandsindbank.co.in", "ibpsonline.ibps.in", "ibps.in"],

    maxItems: 40,
  },

  // =====================================================

  // IDBI BANK

  // =====================================================

  {
    key: "idbi-bank",

    name: "IDBI Bank",

    category: "Government Exams",

    url: "https://www.idbi.bank.in/idbi-bank-careers-current-openings.aspx",

    allowedHosts: ["idbi.bank.in", "idbibank.in", "ibpsonline.ibps.in"],

    maxItems: 40,
  },

  // =====================================================

  // NABARD

  // =====================================================

  {
    key: "nabard",

    name: "NABARD",

    category: "Government Exams",

    url: "https://www.nabard.org/careers-notices1.aspx?cid=693&id=26",

    allowedHosts: ["nabard.org", "ibpsonline.ibps.in"],

    maxItems: 45,
  },

  // =====================================================

  // SIDBI

  // =====================================================

  {
    key: "sidbi",

    name: "SIDBI",

    category: "Government Exams",

    url: "https://www.sidbi.in/en/careers",

    allowedHosts: ["sidbi.in"],

    maxItems: 35,
  },

  // =====================================================

  // EXIM BANK

  // =====================================================

  {
    key: "exim-bank",

    name: "EXIM Bank",

    category: "Government Exams",

    url: "https://www.eximbankindia.in/careers",

    allowedHosts: ["eximbankindia.in"],

    maxItems: 35,
  },

  // =====================================================

  // RAILWAY

  // =====================================================

  {
    key: "railway-rrb",

    name: "Railway / RRB",

    category: "Government Exams",

    url: "https://www.rrbcdg.gov.in/",

    allowedHosts: ["rrbcdg.gov.in"],

    maxItems: 35,
  },

  // =====================================================

  // COMPETITIVE / ENTRANCE EXAMS

  // =====================================================

  {
    key: "nta",

    name: "NTA - Other Exams",

    category: "Competitive Exams",

    url: "https://www.nta.ac.in/",

    allowedHosts: ["nta.ac.in"],

    maxItems: 35,
  },

  {
    key: "jee-main",

    name: "JEE Main",

    category: "Competitive Exams",

    url: "https://jeemain.nta.nic.in/",

    allowedHosts: [
      "jeemain.nta.nic.in",

      "nta.ac.in",

      "cdnbbsr.s3waas.gov.in",

      "examinationservices.nic.in",
    ],

    maxItems: 40,
  },

  {
    key: "jee-advanced",

    name: "JEE Advanced",

    category: "Competitive Exams",

    url: "https://jeeadv.ac.in/",

    allowedHosts: ["jeeadv.ac.in"],

    maxItems: 35,
  },

  {
    key: "neet",

    name: "NEET UG",

    category: "Competitive Exams",

    url: "https://neet.nta.nic.in/",

    allowedHosts: [
      "neet.nta.nic.in",

      "nta.ac.in",

      "cdnbbsr.s3waas.gov.in",

      "examinationservices.nic.in",
    ],

    maxItems: 40,
  },

  {
    key: "cuet",

    name: "CUET UG",

    category: "Competitive Exams",

    url: "https://cuet.nta.nic.in/",

    allowedHosts: [
      "cuet.nta.nic.in",

      "nta.ac.in",

      "cdnbbsr.s3waas.gov.in",

      "examinationservices.nic.in",
    ],

    maxItems: 40,
  },

  {
    key: "mht-cet",

    name: "MHT-CET",

    category: "Competitive Exams",

    url: "https://cetcell.mahacet.org/",

    allowedHosts: ["cetcell.mahacet.org", "mahacet.org"],

    maxItems: 40,

    includeKeywords: ["mht-cet", "mht cet", "pcm group", "pcb group"],
  },

  {
    key: "clat",

    name: "CLAT",

    category: "Competitive Exams",

    url: "https://consortiumofnlus.ac.in/",

    allowedHosts: ["consortiumofnlus.ac.in"],

    maxItems: 30,
  },

  {
    key: "imu-cet",

    name: "IMU CET",

    category: "Competitive Exams",

    url: "https://www.imu.edu.in/imunew/admissions-2026-27",

    allowedHosts: ["imu.edu.in"],

    maxItems: 35,

    includeKeywords: [
      "imu-cet",

      "imu cet",

      "admission",

      "counselling",

      "counseling",

      "rank",

      "allotment",

      "registration",

      "admit card",

      "result",

      "response sheet",
    ],
  },

  {
    key: "nchmct",

    name: "NCHMCT JEE",

    category: "Competitive Exams",

    url: "https://www.nchm.gov.in/circularnotices",

    allowedHosts: ["nchm.gov.in", "nchm.nic.in"],

    maxItems: 30,

    includeKeywords: [
      "jee",

      "entrance test",

      "admission",

      "seat vacancy",

      "result",

      "roll number",

      "allotment",
    ],

    excludeKeywords: [
      "affiliation",

      "delegation of",

      "faculty development",

      "expression of interest",
    ],
  },

  {
    key: "ca-foundation",

    name: "CA Foundation / ICAI",

    category: "Competitive Exams",

    url: "https://www.icai.org/category/examination",

    allowedHosts: ["icai.org"],

    maxItems: 30,

    includeKeywords: [
      "foundation",

      "exam",

      "examination",

      "admit",

      "result",

      "application",
    ],
  },

  {
    key: "cseet",

    name: "CS / CSEET",

    category: "Competitive Exams",

    url: "https://www.icsi.edu/student_rpn/cseet/",

    allowedHosts: ["icsi.edu"],

    maxItems: 30,

    includeKeywords: [
      "cseet",

      "company secretary",

      "exam",

      "examination",

      "result",

      "registration",

      "admit",
    ],
  },

  {
    key: "cma-foundation",

    name: "CMA Foundation / ICMAI",

    category: "Competitive Exams",

    url: "https://icmai.in/studentswebsite/exam.php",

    allowedHosts: ["icmai.in"],

    maxItems: 30,

    includeKeywords: [
      "foundation",

      "exam",

      "examination",

      "admit",

      "result",

      "application",
    ],
  },

  {
    key: "ipmat",

    name: "IPMAT / IIM Indore",

    category: "Competitive Exams",

    url: "https://iimidr.ac.in/programmes/academic-programmes/five-year-integrated-programme-in-management-ipm/ipm-admissions-details/",

    allowedHosts: ["iimidr.ac.in"],

    maxItems: 25,

    includeKeywords: [
      "ipm",

      "ipmat",

      "aptitude test",

      "admission",

      "application",

      "shortlist",

      "result",
    ],
  },

  {
    key: "npat",

    name: "NMIMS NPAT",

    category: "Competitive Exams",

    url: "https://npat.nmims.edu/",

    allowedHosts: ["npat.nmims.edu", "nmims.edu"],

    maxItems: 25,

    includeKeywords: [
      "npat",

      "admission",

      "registration",

      "exam",

      "merit",

      "counselling",

      "counseling",

      "result",
    ],
  },

  // =====================================================

  // MBA ENTRANCE EXAMS

  // =====================================================

  {
    key: "mah-mba-cet",

    name: "MAH MBA / MMS CET",

    category: "Competitive Exams",

    url: "https://cetcell.mahacet.org/",

    allowedHosts: ["cetcell.mahacet.org", "mahacet.org"],

    maxItems: 35,

    includeKeywords: [
      "mah-mba",

      "mah mba",

      "mba/mms",

      "mba mms",

      "mba/mms-cet",

      "mba/mms cet",
    ],
  },

  {
    key: "cat",

    name: "CAT",

    category: "Competitive Exams",

    url: "https://iimcat.ac.in/",

    allowedHosts: ["iimcat.ac.in"],

    maxItems: 35,

    includeKeywords: [
      "cat 2026",

      "cat 2027",

      "common admission test",

      "registration",

      "admit card",

      "result",

      "score",

      "correction",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "mat",

    name: "MAT / AIMA",

    category: "Competitive Exams",

    url: "https://mat.aima.in/",

    allowedHosts: ["mat.aima.in", "aima.in"],

    maxItems: 35,

    includeKeywords: [
      "management aptitude test",

      "mat registration",

      "mat exam",

      "mat admit",

      "mat result",

      "mat score",

      "pbt",

      "cbt",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "cmat",

    name: "CMAT",

    category: "Competitive Exams",

    url: "https://cmat.nta.nic.in/",

    allowedHosts: [
      "cmat.nta.nic.in",

      "nta.ac.in",

      "cdnbbsr.s3waas.gov.in",

      "examinationservices.nic.in",

      "ntaresults.nic.in",

      "testservices.nic.in",

      "cnr.nic.in",
    ],

    maxItems: 40,

    includeKeywords: ["cmat", "common management admission test"],

    sourceKeywordOnly: true,
  },

  {
    key: "xat",

    name: "XAT",

    category: "Competitive Exams",

    url: "https://xatonline.in/",

    allowedHosts: ["xatonline.in", "xlri.ac.in"],

    maxItems: 35,

    includeKeywords: [
      "xat",

      "registration",

      "admit card",

      "result",

      "score",

      "mock",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "nmat",

    name: "NMAT by GMAC",

    category: "Competitive Exams",

    url: "https://www.mba.com/exams/nmat",

    allowedHosts: ["mba.com"],

    maxItems: 35,

    includeKeywords: [
      "nmat",

      "registration",

      "scheduling",

      "schedule",

      "admit card",

      "score",

      "result",

      "retake",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "snap",

    name: "SNAP",

    category: "Competitive Exams",

    url: "https://www.snaptest.org/snap-important-dates",

    allowedHosts: ["snaptest.org"],

    maxItems: 35,

    includeKeywords: [
      "snap",

      "registration",

      "admit card",

      "result",

      "test date",

      "important dates",
    ],

    sourceKeywordOnly: true,
  },

  // =====================================================

  // LAW ENTRANCE EXAMS

  // =====================================================

  {
    key: "ailet",

    name: "AILET",

    category: "Competitive Exams",

    url: "https://nationallawuniversitydelhi.in/",

    allowedHosts: ["nationallawuniversitydelhi.in", "nludelhi.ac.in"],

    maxItems: 35,

    includeKeywords: [
      "ailet",

      "admission notice",

      "notification",

      "registration",

      "admit card",

      "result",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "mah-llb-cet",

    name: "MAH LLB CET",

    category: "Competitive Exams",

    url: "https://cetcell.mahacet.org/",

    allowedHosts: ["cetcell.mahacet.org", "mahacet.org"],

    maxItems: 40,

    includeKeywords: [
      "llb",

      "ll.b",

      "mah-llb",

      "llb 3 yrs",

      "llb 5 yrs",

      "law 3 years",

      "law 5 years",
    ],
  },

  // =====================================================

  // POLICE / ARMY BHARTI

  // =====================================================

  {
    key: "maharashtra-police",

    name: "Maharashtra Police Bharti",

    category: "Government Exams",

    url: "https://www.mahapolice.gov.in/police-recruitment",

    allowedHosts: ["mahapolice.gov.in", "policerecruitment2025.mahait.org"],

    maxItems: 45,

    includeKeywords: [
      "पोलीस",

      "भरती",

      "police",

      "constable",

      "recruitment",

      "srpf",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "indian-army",

    name: "Indian Army / Agniveer",

    category: "Government Exams",

    url: "https://joinindianarmy.nic.in/",

    allowedHosts: ["joinindianarmy.nic.in"],

    maxItems: 40,

    includeKeywords: [
      "agniveer",

      "army",

      "recruitment",

      "common entrance examination",

      "cee",

      "rally",

      "bharti",
    ],

    sourceKeywordOnly: true,
  },

  // =====================================================

  // ADDITIONAL ENGINEERING / ARCHITECTURE EXAMS

  // =====================================================

  {
    key: "bitsat",

    name: "BITSAT",

    category: "Competitive Exams",

    url: "https://www.bitsadmission.com/FD/FD.html",

    allowedHosts: [
      "bitsadmission.com",

      "admissions.bits-pilani.ac.in",

      "bits-pilani.ac.in",
    ],

    maxItems: 35,

    includeKeywords: [
      "bitsat",

      "hall ticket",

      "slot booking",

      "test city",

      "admission",

      "result",

      "iteration",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "viteee",

    name: "VITEEE",

    category: "Competitive Exams",

    url: "https://viteee.vit.ac.in/",

    allowedHosts: ["viteee.vit.ac.in", "vit.ac.in"],

    maxItems: 35,

    includeKeywords: [
      "viteee",

      "application",

      "registration",

      "exam",

      "admit",

      "result",

      "counselling",

      "counseling",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "nata",

    name: "NATA / Architecture Entrance",

    category: "Competitive Exams",

    url: "https://www.nata.in/",

    allowedHosts: ["nata.in"],

    maxItems: 35,

    includeKeywords: [
      "nata",

      "architecture",

      "application",

      "registration",

      "admit",

      "result",

      "score",

      "test",
    ],

    sourceKeywordOnly: true,
  },

  // =====================================================

  // DEFENCE EXAMS

  // =====================================================

  {
    key: "afcat",

    name: "AFCAT",

    category: "Government Exams",

    url: "https://careerairforce.gov.in/",

    allowedHosts: ["careerairforce.gov.in", "afcat.cdac.in", "cdac.in"],

    maxItems: 35,

    includeKeywords: [
      "afcat",

      "air force common admission test",

      "registration",

      "notification",

      "admit",

      "result",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "upsc-capf",

    name: "UPSC CAPF (Assistant Commandants)",

    category: "Government Exams",

    url: "https://www.upsc.gov.in/whats-new",

    allowedHosts: ["upsc.gov.in", "upsconline.nic.in"],

    maxItems: 30,

    includeKeywords: [
      "central armed police forces",

      "capf",

      "assistant commandant",

      "assistant commandants",
    ],
  },

  {
    key: "upsc-epfo",

    name: "UPSC EPFO",

    category: "Government Exams",

    url: "https://www.upsc.gov.in/whats-new",

    allowedHosts: ["upsc.gov.in", "upsconline.nic.in"],

    maxItems: 30,

    includeKeywords: [
      "epfo",

      "provident fund",

      "enforcement officer",

      "accounts officer",

      "assistant provident fund commissioner",

      "apfc",
    ],
  },

  // =====================================================

  // MAHARASHTRA CET - ADDITIONAL EXAMS

  // =====================================================

  {
    key: "mah-bhmct-bba-bca-bms",

    name: "MAH BHMCT / BCA / BBA / BMS / BBM CET",

    category: "Competitive Exams",

    url: "https://cetcell.mahacet.org/",

    allowedHosts: ["cetcell.mahacet.org", "mahacet.org"],

    maxItems: 40,

    includeKeywords: [
      "bhmct",

      "bca/bba",

      "bba/bms",

      "bba",

      "bms",

      "bbm",

      "b.hmct",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "mah-mca-cet",

    name: "MAH MCA CET",

    category: "Competitive Exams",

    url: "https://cetcell.mahacet.org/",

    allowedHosts: ["cetcell.mahacet.org", "mahacet.org"],

    maxItems: 35,

    includeKeywords: ["mah-mca", "mah mca", "mca cet", "mca &"],

    sourceKeywordOnly: true,
  },

  {
    key: "mah-bed-cet",

    name: "MAH B.Ed CET",

    category: "Competitive Exams",

    url: "https://cetcell.mahacet.org/",

    allowedHosts: ["cetcell.mahacet.org", "mahacet.org"],

    maxItems: 35,

    includeKeywords: ["bed cet", "b.ed cet", "b.ed.", "b ed cet"],

    sourceKeywordOnly: true,
  },

  {
    key: "mah-bdesign-cet",

    name: "MAH B.Design CET",

    category: "Competitive Exams",

    url: "https://cetcell.mahacet.org/",

    allowedHosts: ["cetcell.mahacet.org", "mahacet.org"],

    maxItems: 35,

    includeKeywords: ["b.design", "b design", "b-design", "mah-b.design"],

    sourceKeywordOnly: true,
  },

  {
    key: "mh-nursing-cet",

    name: "MH Nursing CET",

    category: "Competitive Exams",

    url: "https://cetcell.mahacet.org/",

    allowedHosts: ["cetcell.mahacet.org", "mahacet.org"],

    maxItems: 35,

    includeKeywords: ["nursing cet", "mh nursing", "mh-nursing"],

    sourceKeywordOnly: true,
  },

  {
    key: "mh-paramedical-cet",

    name: "Maharashtra Paramedical CET",

    category: "Competitive Exams",

    url: "https://cetcell.mahacet.org/",

    allowedHosts: ["cetcell.mahacet.org", "mahacet.org"],

    maxItems: 35,

    includeKeywords: ["dpn/phn", "dpn", "phn", "paramedical", "health science"],

    sourceKeywordOnly: true,
  },

  // =====================================================

  // MBA / MANAGEMENT - ADDITIONAL

  // =====================================================

  {
    key: "atma",

    name: "ATMA",

    category: "Competitive Exams",

    url: "https://atmaaims.com/",

    allowedHosts: ["atmaaims.com"],

    maxItems: 35,

    includeKeywords: [
      "atma",

      "management aptitude",

      "registration",

      "admit",

      "result",

      "score",

      "exam",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "ibsat",

    name: "IBSAT",

    category: "Competitive Exams",

    url: "https://general.ibsindia.org/",

    allowedHosts: [
      "ibsindia.org",

      "general.ibsindia.org",

      "admissions.ibsindia.org",
    ],

    maxItems: 35,

    includeKeywords: [
      "ibsat",

      "application",

      "registration",

      "test",

      "result",

      "selection",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "micat",

    name: "MICAT / MICA Admissions",

    category: "Competitive Exams",

    url: "https://www.mica.ac.in/admissions/",

    allowedHosts: ["mica.ac.in"],

    maxItems: 35,

    includeKeywords: [
      "micat",

      "admission",

      "registration",

      "admit card",

      "score",

      "result",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "iift-admissions",

    name: "IIFT MBA Admissions",

    category: "Competitive Exams",

    url: "https://iiftnew.iift.ac.in/admission-2026",

    allowedHosts: ["iift.ac.in", "iiftnew.iift.ac.in"],

    maxItems: 30,

    includeKeywords: [
      "mba",

      "admission",

      "cat",

      "shortlist",

      "result",

      "registration",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "tiss-admissions",

    name: "TISS PG Admissions",

    category: "Competitive Exams",

    url: "https://admissions.tiss.ac.in/",

    allowedHosts: ["tiss.ac.in", "admissions.tiss.ac.in", "appln.tiss.ac.in"],

    maxItems: 35,

    includeKeywords: [
      "cuet",

      "cat-pg",

      "cat pg",

      "admission",

      "entrance test",

      "merit list",

      "application",
    ],

    sourceKeywordOnly: true,
  },

  // =====================================================

  // PROFESSIONAL / COMMERCE EXAMS

  // =====================================================

  {
    key: "ca-intermediate",

    name: "CA Intermediate / ICAI",

    category: "Competitive Exams",

    url: "https://www.icai.org/category/examination",

    allowedHosts: ["icai.org", "www.icai.org", "caresults.icai.org"],

    maxItems: 35,

    includeKeywords: [
      "intermediate",

      "ca intermediate",

      "intermediate examination",
    ],
  },

  {
    key: "cs-executive",

    name: "CS Executive / ICSI",

    category: "Competitive Exams",

    url: "https://www.icsi.edu/academic-portal",

    allowedHosts: ["icsi.edu", "www.icsi.edu"],

    maxItems: 35,

    includeKeywords: [
      "executive programme",

      "cs executive",

      "executive examination",

      "executive programme examination",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "cma-intermediate",

    name: "CMA Intermediate / ICMAI",

    category: "Competitive Exams",

    url: "https://icmai.in/studentswebsite/exam.php",

    allowedHosts: ["icmai.in", "www.icmai.in", "examicmai.in"],

    maxItems: 35,

    includeKeywords: [
      "intermediate",

      "intermediate examination",

      "inter & final",

      "intermediate & final",
    ],

    sourceKeywordOnly: true,
  },

  // =====================================================

  // FINANCIAL REGULATOR / INSURANCE EXAMS

  // =====================================================

  {
    key: "sebi-grade-a",

    name: "SEBI Grade A",

    category: "Government Exams",

    url: "https://www.sebi.gov.in/sebiweb/about/AboutAction.do?doVacancies=yes",

    allowedHosts: ["sebi.gov.in"],

    maxItems: 40,

    includeKeywords: [
      "grade a",

      "assistant manager",

      "recruitment of officer",

      "recruitment of officers",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "lic-recruitment",

    name: "LIC AAO / ADO",

    category: "Government Exams",

    url: "https://licindia.in/en/careers",

    allowedHosts: ["licindia.in", "web.licindia.in"],

    maxItems: 40,

    includeKeywords: [
      "aao",

      "ado",

      "assistant administrative officer",

      "apprentice development officer",

      "recruitment",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "niacl-recruitment",

    name: "NIACL Administrative Officer",

    category: "Government Exams",

    url: "https://www.newindia.co.in/recruitment/list",

    allowedHosts: ["newindia.co.in", "www.newindia.co.in"],

    maxItems: 40,

    includeKeywords: [
      "administrative officer",

      "administrative officers",

      "ao",

      "recruitment",
    ],

    sourceKeywordOnly: true,
  },

  // =====================================================

  // RAILWAY PROTECTION FORCE

  // =====================================================

  {
    key: "rpf",

    name: "RPF Constable / Sub-Inspector",

    category: "Government Exams",

    url: "https://rrcb.gov.in/",

    allowedHosts: ["rrcb.gov.in", "rrbcdg.gov.in"],

    maxItems: 35,

    includeKeywords: ["rpf", "constable", "sub inspector", "sub-inspector"],

    sourceKeywordOnly: true,
  },

  // =====================================================

  // DESIGN / FASHION

  // =====================================================

  {
    key: "nift",

    name: "NIFT Entrance Examination",

    category: "Competitive Exams",

    url: "https://nift.ac.in/admissions",

    allowedHosts: [
      "nift.ac.in",

      "www.nift.ac.in",

      "exams.nta.ac.in",

      "nta.ac.in",
    ],

    maxItems: 40,

    includeKeywords: [
      "nift",

      "niftee",

      "admission",

      "entrance examination",

      "admit card",

      "result",

      "seat allocation",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "nid-dat",

    name: "NID Design Aptitude Test (DAT)",

    category: "Competitive Exams",

    url: "https://admissions.nid.edu/",

    allowedHosts: ["admissions.nid.edu", "nid.edu"],

    maxItems: 40,

    includeKeywords: [
      "dat",

      "design aptitude test",

      "b.des",

      "m.des",

      "admission",

      "result",

      "rechecking",

      "seat allotment",
    ],

    sourceKeywordOnly: true,
  },

  {
    key: "uceed",

    name: "UCEED",

    category: "Competitive Exams",

    url: "https://www.uceed.iitb.ac.in/2026/",

    allowedHosts: ["uceed.iitb.ac.in", "iitb.ac.in"],

    maxItems: 35,

    includeKeywords: [
      "uceed",

      "registration",

      "admit card",

      "result",

      "score card",

      "admission",
    ],

    sourceKeywordOnly: true,
  },

  // =====================================================

  // CUET PG

  // =====================================================

  {
    key: "cuet-pg",

    name: "CUET PG",

    category: "Competitive Exams",

    url: "https://exams.nta.nic.in/cuet-pg/",

    allowedHosts: [
      "exams.nta.nic.in",

      "nta.ac.in",

      "cdnbbsr.s3waas.gov.in",

      "examinationservices.nic.in",

      "ntaresults.nic.in",
    ],

    maxItems: 45,

    includeKeywords: ["cuet pg", "cuet(pg)", "cuet (pg)", "postgraduate"],

    sourceKeywordOnly: true,
  },

  // =====================================================

  // COMPUTER / IT ENTRANCE

  // =====================================================

  {
    key: "nimcet",

    name: "NIMCET",

    category: "Competitive Exams",

    url: "https://nimcet.admissions.nic.in/",

    allowedHosts: ["nimcet.admissions.nic.in", "admissions.nic.in"],

    maxItems: 40,

    includeKeywords: [
      "nimcet",

      "mca",

      "registration",

      "application",

      "admit",

      "result",

      "counselling",

      "counseling",

      "allotment",

      "rank",
    ],

    sourceKeywordOnly: true,
  },
];

export const OFFICIAL_EXAM_SOURCES = SOURCES.map((source) => ({
  key: source.key,

  name: source.name,

  category: source.category,

  url: source.url,
}));

const RELEVANT_KEYWORDS = [
  "exam",

  "examination",

  "board examination",

  "admit card",

  "e-admit",

  "hall ticket",

  "result",

  "results",

  "answer key",

  "answer keys",

  "answerkey",

  "application",

  "applications",

  "apply",

  "apply online",

  "registration",

  "register",

  "recruitment",

  "vacancy",

  "vacancies",

  "notification",

  "notice",

  "public notice",

  "announcement",

  "circular",

  "date sheet",

  "datesheet",

  "time table",

  "timetable",

  "exam date",

  "examination date",

  "schedule",

  "score",

  "score card",

  "scorecard",

  "marks",

  "merit",

  "merit list",

  "interview",

  "interview schedule",

  "counselling",

  "counseling",

  "shortlisted",

  "shortlist",

  "written result",

  "final result",

  "provisional",

  "challenge",

  "supplementary",

  "response sheet",

  "recorded response",

  "omr",

  "exam city",

  "examination city",

  "city intimation",

  "cut off",

  "cut-off",

  "cutoff",

  "seat allotment",

  "allotment",

  "information bulletin",

  "brochure",

  "admission",

  "correction",

  "corrigendum",

  "extension",

  "extended",

  "press release",

  "eligibility",
];

const BLOCKED_KEYWORDS = [
  "request for proposal",

  "rfp",

  "tender",

  "procurement",

  "website policy",

  "privacy policy",

  "copyright policy",

  "contact us",

  "about us",

  "annual report",

  "sitemap",
];

const GENERIC_LINK_TEXT =
  /^(read more|view|download|pdf|click here|new|more|details|attachment)$/i;

function cleanText(value: string) {
  return value

    .replace(/\u00a0/g, " ")

    .replace(/\s+/g, " ")

    .trim();
}

function cleanTitle(value: string) {
  return cleanText(value)
    .replace(/\bRead More\b/gi, "")

    .replace(/\bDownload\b/gi, "")

    .replace(/\(\s*\d+(?:\.\d+)?\s*(?:KB|MB)\s*\)/gi, "")

    .replace(/\s+-\s+reg\.?$/i, "")

    .replace(/\s{2,}/g, " ")

    .trim();
}

function matchesKeywords(text: string, keywords?: string[]) {
  if (!keywords?.length) {
    return false;
  }

  const lower = text.toLowerCase();

  return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
}

function isRelevantTitle(title: string, source: ExamSource) {
  const cleaned = cleanText(title);

  const lower = cleaned.toLowerCase();

  if (cleaned.length < 8 || cleaned.length > 260) {
    return false;
  }

  if (
    /^(click here|click here to apply|apply now|exam calendar|read more|view more|view|download|more|details)$/i.test(
      cleaned,
    )
  ) {
    return false;
  }

  if (
    /^calendar\s+active examinations\s+forthcoming examinations/i.test(cleaned)
  ) {
    return false;
  }

  if (BLOCKED_KEYWORDS.some((word) => lower.includes(word))) {
    return false;
  }

  if (matchesKeywords(cleaned, source.excludeKeywords)) {
    return false;
  }

  const matchesGlobalKeyword = RELEVANT_KEYWORDS.some((word) =>
    lower.includes(word),
  );

  const matchesSourceKeyword = matchesKeywords(cleaned, source.includeKeywords);

  /*

   * For a source with exam-specific keywords,

   * require both:

   *

   * 1. the notice to relate to that source/exam

   * 2. the title to look like an actual exam update

   */

  if (source.includeKeywords?.length) {
    return (
      matchesSourceKeyword && (source.sourceKeywordOnly || matchesGlobalKeyword)
    );
  }

  return matchesGlobalKeyword;
}

function classifyUpdate(title: string): ExamUpdateType {
  const lower = title.toLowerCase();

  if (
    lower.includes("admit card") ||
    lower.includes("e-admit") ||
    lower.includes("hall ticket")
  ) {
    return "Admit Card";
  }

  if (
    lower.includes("answer key") ||
    lower.includes("answerkey") ||
    lower.includes("recorded response") ||
    lower.includes("response sheet")
  ) {
    return "Answer Key";
  }

  if (
    lower.includes("result") ||
    lower.includes("score card") ||
    lower.includes("scorecard") ||
    lower.includes("marks of") ||
    lower.includes("merit list") ||
    lower.includes("rank certificate") ||
    lower.includes("provisional shortlist") ||
    lower.includes("final shortlist")
  ) {
    return "Result";
  }

  if (
    lower.includes("application") ||
    lower.includes("apply online") ||
    lower.includes("registration") ||
    lower.includes("online form")
  ) {
    return "Application";
  }

  if (
    lower.includes("time table") ||
    lower.includes("timetable") ||
    lower.includes("date sheet") ||
    lower.includes("datesheet") ||
    lower.includes("exam date") ||
    lower.includes("examination date") ||
    lower.includes("schedule") ||
    lower.includes("exam city") ||
    lower.includes("examination city") ||
    lower.includes("city intimation")
  ) {
    return "Exam Date";
  }

  if (
    lower.includes("recruitment") ||
    lower.includes("vacancy") ||
    lower.includes("vacancies") ||
    lower.includes("posts of") ||
    lower.includes("post of")
  ) {
    return "Recruitment";
  }

  return "Notification";
}

function stableId(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);

    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function extractDateLabel(text: string) {
  const monthPattern =
    "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Sept(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";

  const patterns = [
    new RegExp(`\\b(${monthPattern}\\s+\\d{1,2},?\\s+20\\d{2})\\b`, "i"),

    new RegExp(`\\b(\\d{1,2}\\s+${monthPattern},?\\s+20\\d{2})\\b`, "i"),

    /\b(\d{1,2}[./-]\d{1,2}[./-]20\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return cleanText(match[1]);
    }
  }

  return undefined;
}

function isAllowedOfficialUrl(url: URL, source: ExamSource) {
  return source.allowedHosts.some(
    (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
  );
}

function shouldIgnoreHref(href: string) {
  const normalized = href.trim().toLowerCase();

  return (
    normalized.startsWith("#") ||
    normalized.startsWith("javascript:") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("tel:")
  );
}

function buildRequestHeaders() {
  return {
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

    "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",

    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
  };
}

async function fetchSource(source: ExamSource): Promise<ExamUpdate[]> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 12000);

  try {
    const response = await fetch(source.url, {
      next: {
        revalidate: 900,
      },

      redirect: "follow",

      signal: controller.signal,

      headers: buildRequestHeaders(),
    });

    /*

     * Government and education websites may block

     * automated requests.

     *

     * One unavailable authority must never break

     * the complete Exam Updates page.

     */

    if (!response.ok) {
      console.warn(
        `[Exam Updates] ${source.name} unavailable: HTTP ${response.status}`,
      );

      return [];
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      console.warn(
        `[Exam Updates] ${source.name} returned unsupported content type: ${contentType}`,
      );

      return [];
    }

    const html = await response.text();

    if (!html.trim()) {
      return [];
    }

    const $ = cheerio.load(html);

    const updates: ExamUpdate[] = [];

    const seenUrls = new Set<string>();

    $("a[href]").each((_, element) => {
      if (updates.length >= source.maxItems) {
        return false;
      }

      const anchor = $(element);

      const rawHref = anchor.attr("href");

      if (!rawHref || shouldIgnoreHref(rawHref)) {
        return;
      }

      let officialUrl: URL;

      try {
        officialUrl = new URL(rawHref, source.url);
      } catch {
        return;
      }

      if (
        officialUrl.protocol !== "https:" &&
        officialUrl.protocol !== "http:"
      ) {
        return;
      }

      /*

       * Critical trust check:

       *

       * Only approved official authority domains

       * are allowed to become outbound links.

       */

      if (!isAllowedOfficialUrl(officialUrl, source)) {
        return;
      }

      officialUrl.hash = "";

      const finalUrl = officialUrl.toString();

      if (seenUrls.has(finalUrl)) {
        return;
      }

      /*

       * Official sites use many different structures.

       *

       * Some anchors contain the real title directly.

       * Others only contain:

       *

       * View

       * PDF

       * Download

       * Click Here

       *

       * Therefore collect text from both the anchor

       * and its surrounding notice/card/table row.

       */

      const anchorText = cleanText(anchor.text());

      const anchorTitle = cleanText(anchor.attr("title") ?? "");

      const ariaLabel = cleanText(anchor.attr("aria-label") ?? "");

      const possibleContexts = [
        anchor.closest("tr").first().text(),

        anchor.closest("li").first().text(),

        anchor.closest("article").first().text(),

        anchor.closest("[class*='notice']").first().text(),

        anchor.closest("[class*='news']").first().text(),

        anchor.closest("[class*='update']").first().text(),

        anchor.closest("[class*='announcement']").first().text(),

        anchor.closest("[class*='card']").first().text(),

        anchor.closest("[class*='item']").first().text(),

        anchor.parent().text(),

        anchor.parent().parent().text(),
      ]

        .map(cleanText)

        .filter(Boolean);

      const contextText =
        possibleContexts.find(
          (text) => text.length >= 8 && text.length <= 700,
        ) ?? "";

      const titleCandidates = [anchorText, anchorTitle, ariaLabel, contextText]

        .map(cleanTitle)

        .filter(
          (candidate) => candidate.length >= 8 && candidate.length <= 260,
        );

      const title = titleCandidates.find(
        (candidate) =>
          !GENERIC_LINK_TEXT.test(candidate) &&
          isRelevantTitle(candidate, source),
      );

      if (!title) {
        return;
      }

      seenUrls.add(finalUrl);

      updates.push({
        id: `${source.key}-${stableId(finalUrl)}`,

        title,

        source: source.name,

        sourceKey: source.key,

        category: source.category,

        type: classifyUpdate(title),

        officialUrl: finalUrl,

        publishedLabel: extractDateLabel(contextText),
      });
    });

    return updates;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn(`[Exam Updates] ${source.name} request timed out.`);

      return [];
    }

    console.warn(
      `[Exam Updates] ${source.name} temporarily unavailable.`,

      error instanceof Error ? error.message : String(error),
    );

    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function interleaveUpdates(groups: ExamUpdate[][], limit = 400) {
  const output: ExamUpdate[] = [];

  const seen = new Set<string>();

  let position = 0;

  /*

   * Interleave sources instead of appending:

   *

   * UPSC #1

   * SSC #1

   * IBPS #1

   * CBSE #1

   * JEE #1

   * NEET #1

   * ...

   *

   * Then source #2, source #3, etc.

   *

   * This prevents one authority from taking over

   * the full feed.

   */

  while (output.length < limit) {
    let addedSomething = false;

    for (const group of groups) {
      const item = group[position];

      if (!item) {
        continue;
      }

      addedSomething = true;

      if (!seen.has(item.officialUrl)) {
        seen.add(item.officialUrl);

        output.push(item);
      }

      if (output.length >= limit) {
        break;
      }
    }

    if (!addedSomething) {
      break;
    }

    position += 1;
  }

  return output;
}

/*

 * Cache the combined exam updates.

 *

 * Students should not have to wait for all official

 * authorities to respond every time the page opens.

 */

const getCachedExamUpdates = unstable_cache(
  async (): Promise<ExamUpdate[]> => {
    const startedAt = Date.now();

    /*

     * All authorities are fetched concurrently.

     *

     * Each source independently handles:

     * - timeout

     * - HTTP errors

     * - unsupported response type

     * - scraping problems

     *

     * Therefore one failed authority does not

     * break the overall page.

     */

    const groups = await Promise.all(
      SOURCES.map(async (source) => {
        const sourceStartedAt = Date.now();

        const updates = await fetchSource(source);

        console.info(
          `[Exam Updates] ${source.name}: ${updates.length} updates in ${
            Date.now() - sourceStartedAt
          }ms`,
        );

        return updates;
      }),
    );

    const updates = interleaveUpdates(groups);

    console.info(
      `[Exam Updates] Refresh completed in ${
        Date.now() - startedAt
      }ms. Loaded ${updates.length} updates.`,
    );

    return updates;
  },

  /*

   * New cache version.

   *

   * This prevents the old limited source result

   * from remaining cached after deployment.

   */

  ["smartiq-exam-updates-v6"],

  {
    revalidate: 900,

    tags: ["smartiq-exam-updates"],
  },
);

/*

 * Public function used by:

 *

 * app/exam-updates/page.tsx

 */

export async function getExamUpdates(): Promise<ExamUpdate[]> {
  return getCachedExamUpdates();
}
