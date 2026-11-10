import { courseLibrary } from "@/lib/course-library";

export const COURSE_SITE_URL = "https://smartiqinstitute.in";

export type CoursePageDefinition = {
  slug: string;
  sourceKey: string;
  name: string;
  category: string;
  introduction: string;
  programme?: string;
  keywords?: string[];
};

export const coursePageRegistry: CoursePageDefinition[] = [
  {
    slug: "class-6-tuition",
    sourceKey: "class-6-additional",
    name: "Class 6 Tuition",
    category: "School Tuition",
    introduction:
      "Explore Class 6 academic support across school subjects, with board-aligned learning, revision and personalised guidance.",
  },
  {
    slug: "class-7-tuition",
    sourceKey: "class-7-additional",
    name: "Class 7 Tuition",
    category: "School Tuition",
    introduction:
      "Build Class 7 subject knowledge through guided practice, concept development and structured academic support.",
  },
  {
    slug: "class-8-tuition",
    sourceKey: "class-8-additional",
    name: "Class 8 Tuition",
    category: "School Tuition",
    introduction:
      "Strengthen Class 8 academic foundations with subject-focused tuition, regular revision and learning support.",
  },
  {
    slug: "class-9-tuition",
    sourceKey: "class-9-additional",
    name: "Class 9 Tuition",
    category: "School Tuition",
    introduction:
      "Prepare for secondary-school academics with Class 9 subject guidance, concept building and assessment practice.",
  },
  {
    slug: "class-10-tuition",
    sourceKey: "class-10-additional",
    name: "Class 10 Tuition",
    category: "School Tuition",
    introduction:
      "Prepare for Class 10 board examinations with subject-wise support, revision, practice and doubt-solving.",
  },
  {
    slug: "class-11-tuition",
    sourceKey: "class-11-additional",
    name: "Class 11 Tuition",
    category: "Junior College",
    introduction:
      "Explore Class 11 tuition across academic streams, with subject selection and structured exam preparation.",
  },
  {
    slug: "class-12-tuition",
    sourceKey: "class-12-additional",
    name: "Class 12 Tuition",
    category: "Junior College",
    introduction:
      "Build Class 12 board examination readiness through subject-specific study, revision and academic guidance.",
  },
  {
    slug: "ca-foundation",
    sourceKey: "class-11-additional",
    name: "CA Foundation",
    category: "Entrance Exams",
    programme: "CA Foundation",
    introduction:
      "Explore CA Foundation preparation covering accounting, business laws, economics and quantitative aptitude.",
  },
  {
    slug: "jee-coaching",
    sourceKey: "class-11-additional",
    name: "JEE Coaching",
    category: "Entrance Exams",
    programme: "JEE",
    introduction:
      "Explore JEE preparation in mathematics, physics and chemistry with problem-solving and examination practice.",
  },
  {
    slug: "neet-coaching",
    sourceKey: "class-11-additional",
    name: "NEET Coaching",
    category: "Entrance Exams",
    programme: "NEET",
    introduction:
      "Explore NEET preparation in biology, physics and chemistry with concept development and examination practice.",
  },
  {
    slug: "mht-cet",
    sourceKey: "mht-cet-exams",
    name: "MHT CET Coaching",
    category: "Entrance Exams",
    introduction:
      "Explore preparation for Maharashtra entrance examination pathways, including engineering, pharmacy and other professional programmes.",
  },
  {
    slug: "banking-exams",
    sourceKey: "banking-exams",
    name: "Banking Exam Coaching",
    category: "Government Exams",
    introduction:
      "Prepare for banking recruitment examinations through quantitative aptitude, reasoning, English, banking awareness and mock-test practice.",
  },
  {
    slug: "ssc-coaching",
    sourceKey: "ssc",
    name: "SSC Coaching",
    category: "Government Exams",
    introduction:
      "Explore SSC examination preparation covering quantitative aptitude, reasoning, English and general awareness.",
  },
  {
    slug: "railway-exams",
    sourceKey: "railways-exams",
    name: "Railway Exam Coaching",
    category: "Government Exams",
    introduction:
      "Prepare for railway recruitment examinations through mathematics, reasoning, general science and examination-focused practice.",
  },
  {
    slug: "police-bharti",
    sourceKey: "police-army-bharti",
    name: "Police Bharti Coaching",
    category: "Government Exams",
    introduction:
      "Explore Police Bharti examination preparation with written-test subjects, reasoning, general knowledge and physical-test guidance.",
  },
  {
    slug: "upsc-coaching",
    sourceKey: "upsc-civil-services",
    name: "UPSC Coaching",
    category: "Government Exams",
    introduction:
      "Explore UPSC Civil Services preparation for preliminary examinations, mains answer writing and interview readiness.",
  },
  {
    slug: "mpsc-coaching",
    sourceKey: "state-psc-exams",
    name: "MPSC Coaching",
    category: "Government Exams",
    programme: "MPSC",
    introduction:
      "Explore MPSC examination preparation covering general studies, aptitude, current affairs and Maharashtra-specific topics.",
  },
  {
    slug: "nda-cds-afcat",
    sourceKey: "defence-paramilitary-exams",
    name: "NDA, CDS and AFCAT Coaching",
    category: "Government Exams",
    introduction:
      "Explore defence examination preparation with aptitude, general knowledge, English and examination-specific guidance.",
  },
  {
    slug: "spoken-english",
    sourceKey: "skills-communication",
    name: "Spoken English",
    category: "Skill Courses",
    programme: "Spoken English",
    introduction:
      "Develop spoken English through pronunciation, vocabulary, daily communication and speaking-confidence activities.",
  },
  {
    slug: "personality-development",
    sourceKey: "skills-communication",
    name: "Personality Development",
    category: "Skill Courses",
    programme: "Personality Development",
    introduction:
      "Explore communication, self-confidence, interpersonal skills, presentation and personal development.",
  },
  {
    slug: "robotics",
    sourceKey: "skills-tech-future",
    name: "Robotics",
    category: "Skill Courses",
    programme: "Robotics",
    introduction:
      "Explore robotics fundamentals, sensors, programming, electronics and practical STEM projects.",
  },
  {
    slug: "coding-ai",
    sourceKey: "skills-tech-future",
    name: "Coding and AI",
    category: "Skill Courses",
    introduction:
      "Discover coding, artificial intelligence fundamentals, digital technology and project-based learning.",
  },

  // Banking recruitment examinations
  {
    slug: "ibps-po",
    sourceKey: "banking-exams",
    name: "IBPS PO",
    programme: "IBPS PO",
    category: "Government Exams",
    introduction:
      "Prepare for the IBPS Probationary Officer recruitment examination with reasoning, quantitative aptitude, English, banking awareness and examination practice.",
  },
  {
    slug: "ibps-clerk",
    sourceKey: "banking-exams",
    name: "IBPS Clerk",
    programme: "IBPS Clerk",
    category: "Government Exams",
    introduction:
      "Explore IBPS clerical recruitment examination preparation, including numerical ability, reasoning, English and banking awareness.",
  },
  {
    slug: "sbi-po",
    sourceKey: "banking-exams",
    name: "SBI PO",
    programme: "SBI PO",
    category: "Government Exams",
    introduction:
      "Explore SBI Probationary Officer preparation, including aptitude, reasoning, English, general awareness and recruitment-stage practice.",
  },
  {
    slug: "sbi-clerk",
    sourceKey: "banking-exams",
    name: "SBI Clerk",
    programme: "SBI Clerk",
    category: "Government Exams",
    introduction:
      "Prepare for SBI Junior Associate recruitment examinations with numerical ability, reasoning, English and banking knowledge.",
  },

  // Staff Selection Commission examinations
  {
    slug: "ssc-cgl",
    sourceKey: "ssc",
    name: "SSC CGL",
    programme: "SSC CGL",
    category: "Government Exams",
    introduction:
      "Explore SSC Combined Graduate Level examination preparation through quantitative aptitude, reasoning, English, general awareness and tier-specific practice.",
  },
  {
    slug: "ssc-chsl",
    sourceKey: "ssc",
    name: "SSC CHSL",
    programme: "SSC CHSL",
    category: "Government Exams",
    introduction:
      "Prepare for the SSC Combined Higher Secondary Level examination through mathematics, English, reasoning, general awareness and practice tests.",
  },
  {
    slug: "ssc-mts",
    sourceKey: "ssc",
    name: "SSC MTS",
    programme: "SSC MTS",
    category: "Government Exams",
    introduction:
      "Explore SSC Multi-Tasking Staff examination preparation with numerical ability, reasoning, English and general awareness.",
  },
  {
    slug: "ssc-cpo",
    sourceKey: "ssc",
    name: "SSC CPO",
    programme: "SSC CPO",
    category: "Government Exams",
    introduction:
      "Prepare for the SSC Central Police Organisation recruitment examination with reasoning, general knowledge, mathematics, English and selection-stage guidance.",
  },

  // Teaching and academic eligibility
  {
    slug: "ctet",
    sourceKey: "teaching-academic-exams",
    name: "CTET",
    programme: "CTET",
    category: "Government Exams",
    introduction:
      "Explore Central Teacher Eligibility Test preparation with child development, pedagogy, language proficiency and subject knowledge.",
  },
  {
    slug: "ugc-net",
    sourceKey: "teaching-academic-exams",
    name: "UGC NET",
    programme: "UGC NET",
    category: "Government Exams",
    introduction:
      "Prepare for UGC NET with teaching and research aptitude, reasoning, comprehension, general awareness and subject-specific studies.",
  },


// ENTRANCE EXAM GROUP COURSE PAGES
{
  slug: "mba-entrance-exams",
  sourceKey: "mba-exams",
  name: "MBA Entrance Exams",
  category: "Entrance Exams",
  introduction:
    "Prepare for management entrance examinations including CAT, CMAT and MBA CET, with quantitative aptitude, logical reasoning, data interpretation, verbal ability and examination practice.",
},
{
  slug: "law-entrance-exams",
  sourceKey: "llb-exams",
  name: "Law Entrance Exams",
  category: "Entrance Exams",
  introduction:
    "Explore preparation for law entrance examinations including CLAT and AILET, covering English, current affairs, legal reasoning, logical reasoning and examination practice.",
},


  // Law and management entrance examinations
  {
    slug: "clat",
    sourceKey: "llb-exams",
    name: "CLAT",
    programme: "CLAT",
    category: "Entrance Exams",
    introduction:
      "Explore Common Law Admission Test preparation through English, current affairs, legal reasoning, logical reasoning and quantitative techniques.",
  },
  {
    slug: "ailet",
    sourceKey: "llb-exams",
    name: "AILET",
    programme: "AILET",
    category: "Entrance Exams",
    introduction:
      "Explore All India Law Entrance Test preparation with examination-focused English, current affairs, reasoning and practice questions.",
  },
  {
    slug: "cat",
    sourceKey: "mba-exams",
    name: "CAT",
    programme: "CAT",
    category: "Entrance Exams",
    introduction:
      "Prepare for the Common Admission Test with quantitative aptitude, data interpretation, logical reasoning and verbal ability.",
  },
  {
    slug: "cmat",
    sourceKey: "mba-exams",
    name: "CMAT",
    programme: "CMAT",
    category: "Entrance Exams",
    introduction:
      "Explore Common Management Admission Test preparation covering quantitative techniques, logical reasoning, language comprehension and general awareness.",
  },
  {
    slug: "mba-cet",
    sourceKey: "mba-exams",
    name: "MBA CET",
    programme: "MBA CET",
    category: "Entrance Exams",
    introduction:
      "Prepare for Maharashtra MBA CET through logical reasoning, abstract reasoning, quantitative aptitude and verbal ability.",
  },

  // Technical postgraduate examinations
  {
    slug: "gate",
    sourceKey: "gate-postgraduate-technical-exams",
    name: "GATE",
    programme: "GATE",
    category: "Entrance Exams",
    introduction:
      "Explore Graduate Aptitude Test in Engineering preparation with technical subject revision, engineering mathematics and examination practice.",
  },

  // Regulatory and insurance recruitment
  {
    slug: "rbi-grade-b",
    sourceKey: "regulatory-insurance-exams",
    name: "RBI Grade B",
    programme: "RBI Grade B",
    category: "Government Exams",
    introduction:
      "Explore RBI Grade B recruitment preparation with aptitude, reasoning, English, economic and social issues, and finance and management.",
  },
  {
    slug: "nabard-grade-a",
    sourceKey: "regulatory-insurance-exams",
    name: "NABARD Grade A",
    programme: "NABARD Grade A",
    category: "Government Exams",
    introduction:
      "Prepare for NABARD Grade A recruitment with aptitude, economic and social issues, agriculture and rural development, and examination practice.",
  },
  {
    slug: "sebi-grade-a",
    sourceKey: "regulatory-insurance-exams",
    name: "SEBI Grade A",
    programme: "SEBI Grade A",
    category: "Government Exams",
    introduction:
      "Explore SEBI Grade A recruitment preparation through finance, commerce, management, economics, reasoning and other relevant subjects.",
  },
  {
    slug: "lic-aao",
    sourceKey: "regulatory-insurance-exams",
    name: "LIC AAO",
    programme: "LIC AAO",
    category: "Government Exams",
    introduction:
      "Prepare for LIC Assistant Administrative Officer recruitment examinations through reasoning, aptitude, English, insurance awareness and practice tests.",
  },
];

export function getCoursePageBySlug(slug: string) {
  const page = coursePageRegistry.find((item) => item.slug === slug);

  if (!page) return null;

  const source = courseLibrary.find(
    (item) => item.standardKey === page.sourceKey,
  );

  if (!source) return null;

  return { ...page, source };
}

export function getCoursePageSlugs() {
  return [
    ...coursePageRegistry.map((page) => page.slug),
    ...courseHubRegistry.map((hub) => hub.slug),
  ];
}

export function getCoursePageUrl(slug: string) {
  return `${COURSE_SITE_URL}/courses/${slug}`;
}

function normaliseCourseName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Returns the dedicated URL for an exact course match.
 *
 * If the name is not registered, the caller should
 * retain the existing enrolment modal.
 *
 * Group keys are never used to guess a programme when
 * several courses share the same parent.
 */
export function getCoursePageHref(
  standardKey: string,
  selectedProgramme?: string,
): string | null {
  const key = standardKey.trim();

  if (!key) {
    return null;
  }

  // Resolve named courses by their actual programme name.
  // The same programme may appear in multiple class tabs.
  if (selectedProgramme?.trim()) {
    const requestedName = normaliseCourseName(selectedProgramme);

    const matchingPage = coursePageRegistry.find(
      (page) =>
        page.sourceKey === key &&
        (normaliseCourseName(page.name) === requestedName ||
          (Boolean(page.programme) &&
            normaliseCourseName(page.programme ?? "") === requestedName) ||
          page.slug === requestedName) &&
        getCoursePageBySlug(page.slug) !== null,
    );

    return matchingPage ? `/courses/${matchingPage.slug}` : null;
  }

  // Without an explicit name, use a source key only
  // when it identifies exactly one registered page.
  const matchingPages = coursePageRegistry.filter(
    (page) => page.sourceKey === key && getCoursePageBySlug(page.slug) !== null,
  );

  if (matchingPages.length !== 1) {
    return null;
  }

  return `/courses/${matchingPages[0].slug}`;
}

export type CourseHubDefinition = {
  slug: string;
  title: string;
  heading: string;
  category: string;
  introduction: string;
};

export const courseHubRegistry: CourseHubDefinition[] = [
  {
    slug: "school-tuition",
    title: "School Tuition | SmartIQ Institute",
    heading: "School Tuition — Classes 6 to 10",
    category: "School Tuition",
    introduction:
      "Explore academic support for Classes 6 to 10. SmartIQ Institute provides subject-focused learning options, including concept development, schoolwork support, revision and examination preparation.",
  },
  {
    slug: "junior-college",
    title: "Junior College | SmartIQ Institute",
    heading: "Junior College — Classes 11 and 12",
    category: "Junior College",
    introduction:
      "Explore Class 11 and Class 12 academic support across Science, Commerce and Arts streams, with subject guidance, revision and higher-secondary examination preparation.",
  },
  {
    slug: "entrance-exams",
    title: "Entrance Exam Coaching | SmartIQ Institute",
    heading: "Entrance Exam Coaching",
    category: "Entrance Exams",
    introduction:
      "Discover preparation options for engineering, medical, commerce, law, management and other entrance examinations. Compare individual programmes and explore their subjects and preparation pathways.",
  },
  {
    slug: "government-exams",
    title: "Government Exam Coaching | SmartIQ Institute",
    heading: "Government Exam Coaching",
    category: "Government Exams",
    introduction:
      "Explore competitive examination preparation for banking, SSC, railways, civil services, teaching eligibility, defence and other government recruitment pathways.",
  },
  {
    slug: "skill-courses",
    title: "Skill Development Courses | SmartIQ Institute",
    heading: "Professional and Future Skills",
    category: "Skill Courses",
    introduction:
      "Explore spoken English, communication, personality development, robotics, coding, AI and other skill development programmes designed to support practical learning.",
  },
];

export function getCourseHubBySlug(slug: string) {
  return courseHubRegistry.find((hub) => hub.slug === slug) ?? null;
}

export function getCoursesForHub(category: string) {
  return coursePageRegistry.filter(
    (page) =>
      page.category === category &&
      getCoursePageBySlug(page.slug) !== null,
  );
}
