import type { GamificationLevel } from "@/lib/types";

export const DEFAULT_GAMIFICATION_LEVELS: GamificationLevel[] = [
  {
    level: 1,
    name: "Beginner",
    pointsRequired: 0,
  },
  {
    level: 2,
    name: "Explorer",
    pointsRequired: 500,
  },
  {
    level: 3,
    name: "Scholar",
    pointsRequired: 1000,
  },
  {
    level: 4,
    name: "Expert",
    pointsRequired: 2000,
  },
  {
    level: 5,
    name: "Champion",
    pointsRequired: 5000,
  },
];