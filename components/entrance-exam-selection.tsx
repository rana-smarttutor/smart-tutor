import GovernmentExamSelection from "@/components/government-exam-selection";
import { getCoursePageBySlug } from "@/lib/course-page-registry";

type EntranceExamGroup = "mba-entrance-exams" | "law-entrance-exams";

type Props = {
  group: EntranceExamGroup;
};

const ENTRANCE_EXAM_OPTIONS: Record<
  EntranceExamGroup,
  {
    title: string;
    slugs: string[];
  }
> = {
  "mba-entrance-exams": {
    title: "MBA Entrance Exam",
    slugs: ["cat", "cmat", "mba-cet"],
  },
  "law-entrance-exams": {
    title: "Law Entrance Exam",
    slugs: ["clat", "ailet"],
  },
};

export default function EntranceExamSelection({ group }: Props) {
  const config = ENTRANCE_EXAM_OPTIONS[group];

  const exams = config.slugs.flatMap((examSlug) => {
    const exam = getCoursePageBySlug(examSlug);

    if (!exam) {
      return [];
    }

    return [
      {
        slug: exam.slug,
        name: exam.name,
        description: exam.introduction,
      },
    ];
  });

  if (!exams.length) {
    return null;
  }

  return (
    <GovernmentExamSelection
      title={config.title}
      exams={exams}
      category="Entrance Exams"
    />
  );
}
