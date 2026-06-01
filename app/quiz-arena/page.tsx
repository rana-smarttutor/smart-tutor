import { Metadata } from "next";
import QuizArenaClient from '@/components/quiz-arena-client';

export const metadata: Metadata = {
  title: "Quiz Arena | Smart Tutors",
  description: "Challenge yourself in our Quiz Arena. Competitive tests and practice sessions to sharpen your skills.",
  alternates: {
    canonical: "https://smarttutors.co.in/quiz-arena",
  },
};

export default function QuizArenaPage() {
  return <QuizArenaClient />;
}