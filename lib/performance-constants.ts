import type { PerformanceHeuristics } from "@/lib/types";

export const DEFAULT_HEURISTICS: PerformanceHeuristics = {
  outstanding: 95,
  excellent: 85,
  good: 70,
  average: 50,
  weak: 40,
};