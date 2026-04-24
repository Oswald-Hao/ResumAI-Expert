import { LocalMetrics, CompositeMetrics, LLMMetrics } from './types';

const EN_ACTION_VERBS = [
  'spearheaded', 'architected', 'designed', 'developed', 'implemented',
  'led', 'managed', 'optimized', 'streamlined', 'delivered',
  'achieved', 'built', 'created', 'established', 'launched',
  'reduced', 'increased', 'improved', 'accelerated', 'automated',
  'collaborated', 'coordinated', 'drove', 'executed', 'facilitated',
  'generated', 'initiated', 'integrated', 'introduced', 'maintained',
  'migrated', 'modernized', 'monitored', 'negotiated', 'orchestrated',
  'overhauled', 'pioneered', 'refactored', 'resolved', 'revamped',
  'scaled', 'secured', 'simplified', 'standardized', 'supervised',
  'transformed', 'unified', 'upgraded', 'validated', 'wrote',
];

const ZH_ACTION_VERBS = [
  '主导', '设计', '开发', '领导', '优化', '引入', '策划', '搭建',
  '重构', '实现', '推动', '建立', '制定', '负责', '构建', '部署',
  '提升', '降低', '缩短', '完成', '创建', '管理', '维护', '修复',
  '改造', '迁移', '整合', '协调', '执行', '交付', '规划', '推进',
  '创新', '改进', '升级', '配置', '监控', '分析', '解决', '评估',
];

const ZH_PASSIVE_PATTERNS = /被[^\s，。；,;]{0,8}[了过]/g;
const ZH_NUMBER_PATTERNS = /[\d]+|[\d]*[万百千万亿]+|[\u4e00-\u9fff]*[多几][个名项位条步骤]/g;

function detectLanguage(text: string): 'en' | 'zh' {
  const zhChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return zhChars > text.length * 0.1 ? 'zh' : 'en';
}

function getBulletLines(text: string): string[] {
  return text.split('\n').filter(line => /^\s*[-*•·]\s+/.test(line.trim()));
}

function getSentences(text: string, lang: 'en' | 'zh'): string[] {
  if (lang === 'zh') {
    return text.split(/[。；\n]+/).map(s => s.trim()).filter(s => s.length > 3);
  }
  return text.split(/[.;\n]+/).map(s => s.trim()).filter(s => s.length > 5);
}

export function computeActionVerbRatio(text: string): number {
  const lang = detectLanguage(text);
  const bullets = getBulletLines(text);
  if (bullets.length === 0) return 0;

  const verbs = lang === 'zh' ? ZH_ACTION_VERBS : EN_ACTION_VERBS;
  let matched = 0;

  for (const line of bullets) {
    const content = line.replace(/^\s*[-*•·]\s+/, '').trim().toLowerCase();
    if (verbs.some(v => content.startsWith(v.toLowerCase()))) {
      matched++;
    }
  }

  return matched / bullets.length;
}

export function computeQuantificationDensity(text: string): number {
  const lang = detectLanguage(text);
  const sentences = getSentences(text, lang);
  if (sentences.length === 0) return 0;

  let quantified = 0;
  for (const s of sentences) {
    if (lang === 'zh') {
      if (ZH_NUMBER_PATTERNS.test(s) || /\d+/.test(s)) {
        quantified++;
      }
    } else {
      if (/\d+/.test(s)) {
        quantified++;
      }
    }
  }

  return quantified / sentences.length;
}

export function computeAvgSentenceLength(text: string): number {
  const lang = detectLanguage(text);
  const sentences = getSentences(text, lang);
  if (sentences.length === 0) return 0;

  if (lang === 'zh') {
    const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
    return totalChars / sentences.length;
  }

  const totalWords = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0);
  return totalWords / sentences.length;
}

export function computePassiveVoiceRatio(text: string): number {
  const lang = detectLanguage(text);
  const sentences = getSentences(text, lang);
  if (sentences.length === 0) return 0;

  let passiveCount = 0;

  if (lang === 'zh') {
    for (const s of sentences) {
      if (ZH_PASSIVE_PATTERNS.test(s)) passiveCount++;
    }
  } else {
    const enPassivePattern = /\b(was|were|is|are|been|being)\s+\w+ed\b/i;
    for (const s of sentences) {
      if (enPassivePattern.test(s)) passiveCount++;
    }
  }

  return passiveCount / sentences.length;
}

export function computeLocalMetrics(text: string): LocalMetrics {
  return {
    actionVerbRatio: computeActionVerbRatio(text),
    quantificationDensity: computeQuantificationDensity(text),
    avgSentenceLength: computeAvgSentenceLength(text),
    passiveVoiceRatio: computePassiveVoiceRatio(text),
  };
}

function normalizeSentenceLengthScore(avgLen: number): number {
  const ideal = 12;
  const tolerance = 8;
  const diff = Math.abs(avgLen - ideal);
  return Math.max(0, 1 - diff / tolerance);
}

export function computeCompositeScore(
  local: LocalMetrics,
  llm: LLMMetrics
): number {
  return (
    0.20 * local.actionVerbRatio +
    0.15 * local.quantificationDensity +
    0.10 * normalizeSentenceLengthScore(local.avgSentenceLength) +
    0.10 * (1 - local.passiveVoiceRatio) +
    0.15 * llm.keywordCoverage +
    0.15 * llm.structuralCompleteness +
    0.15 * llm.coherenceScore
  );
}

export function buildCompositeMetrics(
  local: LocalMetrics,
  llm: LLMMetrics
): CompositeMetrics {
  return {
    ...local,
    ...llm,
    compositeScore: computeCompositeScore(local, llm),
  };
}
