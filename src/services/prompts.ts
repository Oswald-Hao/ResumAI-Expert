import { WeaknessAnalysis, CompositeMetrics } from './types';

export function buildWeaknessAnalysisPrompt(resumeText: string, language: 'en' | 'zh'): string {
  const langText = language === 'zh' ? 'Chinese (Simplified)' : 'English';
  return `You are an expert ATS resume auditor. Analyze the following resume and identify its weaknesses.

Return a JSON object with this exact schema:
{
  "weakActionVerbs": boolean,
  "lacksQuantification": boolean,
  "excessivePassiveVoice": boolean,
  "missingSections": string[],
  "keywordGaps": string[],
  "overallAssessment": string
}

Criteria:
- weakActionVerbs: true if bullet points use weak verbs like "负责/responsible for", "参与/participated", "帮助/helped" instead of strong action verbs
- lacksQuantification: true if fewer than 30% of bullet points contain specific numbers or metrics
- excessivePassiveVoice: true if more than 25% of sentences use passive voice
- missingSections: list any missing standard sections from ["summary", "experience", "education", "skills"]
- keywordGaps: list 3-5 industry-specific keywords that should be present but are missing
- overallAssessment: 2-3 sentence summary of the resume's main weaknesses

IMPORTANT: All text output MUST be in ${langText}.

Here is the resume:
${resumeText}`;
}

export function buildTargetedOptimizationPrompt(
  resumeText: string,
  weaknesses: WeaknessAnalysis,
  language: 'en' | 'zh'
): string {
  const langText = language === 'zh' ? 'Chinese (Simplified)' : 'English';

  let targetedInstructions = '';

  if (weaknesses.weakActionVerbs) {
    targetedInstructions += `
[CRITICAL - ACTION VERBS]: The resume uses weak, passive verbs. You MUST rewrite EVERY bullet point to start with a strong action verb from this list:
  English: Spearheaded, Architected, Designed, Developed, Implemented, Led, Optimized, Streamlined, Delivered, Achieved, Built, Created, Launched, Reduced, Increased, Improved, Automated, Drove, Engineered, Orchestrated
  Chinese: 主导, 设计, 开发, 领导, 优化, 引入, 策划, 搭建, 重构, 实现, 推动, 建立, 制定, 构建, 部署, 提升, 降低, 缩短, 交付, 规划
Do NOT use: 负责, 参与, 帮助, 协助, was responsible for, helped, participated in, assisted with.
`;
  }

  if (weaknesses.lacksQuantification) {
    targetedInstructions += `
[CRITICAL - QUANTIFICATION]: The resume lacks specific metrics. You MUST add concrete numbers to at least 60% of bullet points. Examples:
  - "improved performance by 40%" not "improved performance"
  - "managed a team of 8 engineers" not "managed a team"
  - "将DAU从20万提升至35万" not "提升了用户量"
  - "将页面加载时间从3.5秒优化至1.2秒" not "优化了页面加载"
If exact numbers are not available, use reasonable estimates marked as approximate.
`;
  }

  if (weaknesses.excessivePassiveVoice) {
    targetedInstructions += `
[CRITICAL - ACTIVE VOICE]: The resume overuses passive voice. Convert ALL passive constructions to active voice. Replace "was developed by me" with "Developed", "被分配到" with "担任".
`;
  }

  if (weaknesses.missingSections.length > 0) {
    targetedInstructions += `
[CRITICAL - MISSING SECTIONS]: The resume is missing these standard sections: ${weaknesses.missingSections.join(', ')}. You MUST create these sections with appropriate content based on the resume context.
`;
  }

  if (weaknesses.keywordGaps.length > 0) {
    targetedInstructions += `
[IMPORTANT - KEYWORDS]: Add these relevant industry keywords naturally into the resume: ${weaknesses.keywordGaps.join(', ')}.
`;
  }

  return `You are an expert career counselor, ATS resume optimizer, and recruiter.
I will provide you with a user's resume or career background.

Based on a professional weakness analysis, the following issues were detected:
${weaknesses.overallAssessment}

${targetedInstructions}

Please do the following:
1. Provide a highly optimized version of the resume in Markdown format that addresses ALL the weaknesses above. The resume should use the enhanced structure: Professional Summary, Experience, Education, Skills.
2. Recommend 3-5 suitable job roles for this person.
3. IMPORTANT: All your output, including the optimized resume, job titles, descriptions, and reasoning MUST be entirely in ${langText}.

Return a JSON object with the following schema:
{
  "optimizedResume": "string (Markdown format of the optimized resume)",
  "jobRecommendations": [
    {
      "title": "Job Title",
      "description": "Brief description of the job and why it's a good fit",
      "matchScore": number (out of 100),
      "matchReason": "Why this resume matches the job"
    }
  ]
}

Here is the resume:
${resumeText}`;
}

export function buildScoringPrompt(optimizedResume: string, language: 'en' | 'zh'): string {
  const langText = language === 'zh' ? 'Chinese (Simplified)' : 'English';
  return `You are a senior ATS resume quality evaluator. Score the following optimized resume on three dimensions.

Return a JSON object with this exact schema:
{
  "keywordCoverage": number (0-1, fraction of relevant industry keywords present),
  "structuralCompleteness": number (0-1, are all standard resume sections present and well-organized),
  "coherenceScore": number (0-1, overall logical flow and professional coherence)
}

Scoring guidelines:
- keywordCoverage: Check if the resume contains sufficient industry-specific technical terms and skills keywords
- structuralCompleteness: Check for Professional Summary, clear Experience section with bullet points, Education, Skills section
- coherenceScore: Check logical flow, consistent tense, professional tone throughout

IMPORTANT: Respond ONLY with the JSON object. All reasoning MUST be in ${langText}.

Here is the optimized resume:
${optimizedResume}`;
}

export function buildFeedbackPrompt(
  currentResume: string,
  weaknesses: WeaknessAnalysis,
  metrics: CompositeMetrics,
  round: number,
  language: 'en' | 'zh'
): string {
  const langText = language === 'zh' ? 'Chinese (Simplified)' : 'English';

  const weakAreas: string[] = [];
  if (metrics.actionVerbRatio < 0.7) weakAreas.push(`Action verb ratio is only ${(metrics.actionVerbRatio * 100).toFixed(0)}% (target: >70%)`);
  if (metrics.quantificationDensity < 0.5) weakAreas.push(`Quantification density is only ${(metrics.quantificationDensity * 100).toFixed(0)}% (target: >50%)`);
  if (metrics.passiveVoiceRatio > 0.15) weakAreas.push(`Passive voice ratio is still ${(metrics.passiveVoiceRatio * 100).toFixed(0)}% (target: <15%)`);
  if (metrics.keywordCoverage < 0.7) weakAreas.push(`Keyword coverage is only ${(metrics.keywordCoverage * 100).toFixed(0)}% (target: >70%)`);
  if (metrics.structuralCompleteness < 0.8) weakAreas.push(`Structural completeness is only ${(metrics.structuralCompleteness * 100).toFixed(0)}% (target: >80%)`);
  if (metrics.coherenceScore < 0.7) weakAreas.push(`Coherence score is only ${(metrics.coherenceScore * 100).toFixed(0)}% (target: >70%)`);

  return `You are an expert career counselor and ATS resume optimizer. This is iteration round ${round} of resume optimization.

The current optimized resume still has these weaknesses:
${weakAreas.map(w => `- ${w}`).join('\n')}

Original weaknesses detected:
${weaknesses.overallAssessment}

Please further improve the resume to address the remaining weaknesses. Focus specifically on the areas listed above.

Return a JSON object with the following schema:
{
  "optimizedResume": "string (Markdown format of the further improved resume)",
  "jobRecommendations": [
    {
      "title": "Job Title",
      "description": "Brief description of the job and why it's a good fit",
      "matchScore": number (out of 100),
      "matchReason": "Why this resume matches the job"
    }
  ]
}

IMPORTANT: All output MUST be entirely in ${langText}.

Here is the current optimized resume:
${currentResume}`;
}

export function buildBaselinePrompt(resumeText: string, language: 'en' | 'zh'): string {
  const langText = language === 'zh' ? 'Chinese (Simplified)' : 'English';

  return `You are an expert career counselor, ATS resume optimizer, and recruiter.
I will provide you with a user's resume or career background.

Please do the following:
1. Provide a highly optimized version of the resume in Markdown format. The optimized resume should use strong action verbs, quantifiable metrics where possible, and clear formatting (Summary, Experience, Education, Skills). Enhance the language to sound more professional and impactful.
2. Recommend 3-5 suitable job roles for this person.
3. IMPORTANT: All your output, including the optimized resume, job titles, descriptions, and reasoning MUST be entirely in ${langText}.

Return a JSON object with the following schema:
{
  "optimizedResume": "string (Markdown format of the optimized resume)",
  "jobRecommendations": [
    {
      "title": "Job Title",
      "description": "Brief description of the job and why it's a good fit",
      "matchScore": number (out of 100),
      "matchReason": "Why this resume matches the job"
    }
  ]
}

Here is the resume:
${resumeText}`;
}
