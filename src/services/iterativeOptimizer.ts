import { callLLM } from './llm';
import { OptimizationResult, OptimizeOptions } from './llm';
import {
  WeaknessAnalysis,
  LocalMetrics,
  LLMMetrics,
  CompositeMetrics,
  IterationRecord,
  BeforeAfterComparison,
  IterativeOptimizationResult,
  ExtendedOptimizeOptions,
  OptimizationStage,
} from './types';
import { computeLocalMetrics, buildCompositeMetrics, computeCompositeScore } from './scorer';
import {
  buildWeaknessAnalysisPrompt,
  buildTargetedOptimizationPrompt,
  buildScoringPrompt,
  buildFeedbackPrompt,
} from './prompts';

const MAX_ROUNDS = 3;
const QUALITY_THRESHOLD = 0.75;

function parseJSONSafe<T>(text: string): T {
  const cleaned = text.trim();
  const jsonStr = cleaned.startsWith('```json')
    ? cleaned.replace(/^```json/, '').replace(/```$/, '').trim()
    : cleaned.startsWith('```')
      ? cleaned.replace(/^```/, '').replace(/```$/, '').trim()
      : cleaned;
  return JSON.parse(jsonStr) as T;
}

async function analyzeWeaknesses(
  resumeText: string,
  options: OptimizeOptions,
  onProgress?: (stage: OptimizationStage, detail: string) => void
): Promise<WeaknessAnalysis> {
  onProgress?.('analyzing_weaknesses', '正在分析简历弱点...');
  const prompt = buildWeaknessAnalysisPrompt(resumeText, options.language);
  const response = await callLLM(prompt, options);
  return parseJSONSafe<WeaknessAnalysis>(response);
}

async function scoreWithLLM(
  optimizedResume: string,
  options: OptimizeOptions,
  onProgress?: (stage: OptimizationStage, detail: string) => void
): Promise<LLMMetrics> {
  onProgress?.('scoring', '正在评估优化质量...');
  const prompt = buildScoringPrompt(optimizedResume, options.language);
  const response = await callLLM(prompt, options);
  return parseJSONSafe<LLMMetrics>(response);
}

function computeBeforeAfterComparison(
  beforeMetrics: CompositeMetrics,
  afterMetrics: CompositeMetrics
): BeforeAfterComparison {
  const delta: CompositeMetrics = {
    actionVerbRatio: afterMetrics.actionVerbRatio - beforeMetrics.actionVerbRatio,
    quantificationDensity: afterMetrics.quantificationDensity - beforeMetrics.quantificationDensity,
    avgSentenceLength: afterMetrics.avgSentenceLength - beforeMetrics.avgSentenceLength,
    passiveVoiceRatio: afterMetrics.passiveVoiceRatio - beforeMetrics.passiveVoiceRatio,
    keywordCoverage: afterMetrics.keywordCoverage - beforeMetrics.keywordCoverage,
    structuralCompleteness: afterMetrics.structuralCompleteness - beforeMetrics.structuralCompleteness,
    coherenceScore: afterMetrics.coherenceScore - beforeMetrics.coherenceScore,
    compositeScore: afterMetrics.compositeScore - beforeMetrics.compositeScore,
  };

  const beforePct = beforeMetrics.compositeScore * 100;
  const afterPct = afterMetrics.compositeScore * 100;
  const improvement = beforePct > 0 ? ((afterPct - beforePct) / beforePct) * 100 : 0;

  return {
    beforeMetrics,
    afterMetrics,
    delta,
    improvementPercentage: improvement,
  };
}

export async function optimizeIteratively(
  resumeText: string,
  options: ExtendedOptimizeOptions
): Promise<IterativeOptimizationResult> {
  const startTime = Date.now();
  let totalLLMCalls = 0;

  const progress = (stage: OptimizationStage, detail: string) => {
    options.onProgress?.(stage, detail);
  };

  // Score the original resume
  const beforeLocalMetrics = computeLocalMetrics(resumeText);
  const beforeLLMMetrics = await scoreWithLLM(resumeText, options, progress);
  totalLLMCalls++;
  const beforeMetrics = buildCompositeMetrics(beforeLocalMetrics, beforeLLMMetrics);

  // Stage 1: Weakness Analysis
  const weaknesses = await analyzeWeaknesses(resumeText, options, progress);
  totalLLMCalls++;

  // Stage 2: Build targeted prompt (local, no LLM call)
  progress('building_prompt', '正在构建针对性优化提示...');

  // Stage 3: Generate optimized resume
  progress('generating', '正在生成优化简历 (第1轮)...');
  const optimizationPrompt = buildTargetedOptimizationPrompt(resumeText, weaknesses, options.language);
  const optimizationResponse = await callLLM(optimizationPrompt, options);
  totalLLMCalls++;
  let currentResult = parseJSONSafe<OptimizationResult>(optimizationResponse);

  // Stage 4: Score the optimized resume
  const afterLocalMetrics = computeLocalMetrics(currentResult.optimizedResume);
  const afterLLMMetrics = await scoreWithLLM(currentResult.optimizedResume, options, progress);
  totalLLMCalls++;
  let currentMetrics = buildCompositeMetrics(afterLocalMetrics, afterLLMMetrics);

  // Track iteration history
  const iterationHistory: IterationRecord[] = [
    {
      round: 1,
      result: currentResult,
      metrics: currentMetrics,
      timestamp: Date.now(),
    },
  ];

  let bestResult = currentResult;
  let bestMetrics = currentMetrics;

  // Stage 5: Iterative refinement
  let round = 1;
  while (currentMetrics.compositeScore < QUALITY_THRESHOLD && round < MAX_ROUNDS) {
    round++;
    progress('iterating', `正在进行第${round}轮迭代优化 (当前得分: ${(currentMetrics.compositeScore * 100).toFixed(0)}%)...`);

    const feedbackPrompt = buildFeedbackPrompt(
      currentResult.optimizedResume,
      weaknesses,
      currentMetrics,
      round,
      options.language
    );
    const feedbackResponse = await callLLM(feedbackPrompt, options);
    totalLLMCalls++;
    currentResult = parseJSONSafe<OptimizationResult>(feedbackResponse);

    const iterLocalMetrics = computeLocalMetrics(currentResult.optimizedResume);
    const iterLLMMetrics = await scoreWithLLM(currentResult.optimizedResume, options, progress);
    totalLLMCalls++;
    currentMetrics = buildCompositeMetrics(iterLocalMetrics, iterLLMMetrics);

    iterationHistory.push({
      round,
      result: currentResult,
      metrics: currentMetrics,
      timestamp: Date.now(),
    });

    if (currentMetrics.compositeScore > bestMetrics.compositeScore) {
      bestResult = currentResult;
      bestMetrics = currentMetrics;
    }
  }

  progress('complete', '优化完成！');

  const comparison = computeBeforeAfterComparison(beforeMetrics, bestMetrics);

  return {
    finalResult: bestResult,
    weaknesses,
    iterationHistory,
    totalRounds: iterationHistory.length,
    comparison,
    totalLLMCalls,
    totalTimeMs: Date.now() - startTime,
  };
}
