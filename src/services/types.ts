import { OptimizationResult, OptimizeOptions } from './llm';

// === Weakness Analysis ===
export interface WeaknessAnalysis {
  weakActionVerbs: boolean;
  lacksQuantification: boolean;
  excessivePassiveVoice: boolean;
  missingSections: string[];
  keywordGaps: string[];
  overallAssessment: string;
}

// === Quality Metrics ===
export interface LocalMetrics {
  actionVerbRatio: number;
  quantificationDensity: number;
  avgSentenceLength: number;
  passiveVoiceRatio: number;
}

export interface LLMMetrics {
  keywordCoverage: number;
  structuralCompleteness: number;
  coherenceScore: number;
}

export interface CompositeMetrics extends LocalMetrics, LLMMetrics {
  compositeScore: number;
}

// === Iteration Tracking ===
export interface IterationRecord {
  round: number;
  result: OptimizationResult;
  metrics: CompositeMetrics;
  timestamp: number;
}

// === Before/After Comparison ===
export interface BeforeAfterComparison {
  beforeMetrics: CompositeMetrics;
  afterMetrics: CompositeMetrics;
  delta: CompositeMetrics;
  improvementPercentage: number;
}

// === Top-Level Result ===
export interface IterativeOptimizationResult {
  finalResult: OptimizationResult;
  weaknesses: WeaknessAnalysis;
  iterationHistory: IterationRecord[];
  totalRounds: number;
  comparison: BeforeAfterComparison;
  totalLLMCalls: number;
  totalTimeMs: number;
}

// === Optimization Mode ===
export type OptimizationMode = 'baseline' | 'iterative';

// === Extended Options ===
export interface ExtendedOptimizeOptions extends OptimizeOptions {
  mode: OptimizationMode;
  onProgress?: (stage: OptimizationStage, detail: string) => void;
}

export type OptimizationStage =
  | 'analyzing_weaknesses'
  | 'building_prompt'
  | 'generating'
  | 'scoring'
  | 'iterating'
  | 'complete';
