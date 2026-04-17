import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PRO_MODEL = "gemini-3.1-pro-preview";

export interface OptimizationResult {
  optimizedResume: string;
  jobRecommendations: Array<{
    title: string;
    description: string;
    matchScore: number;
    matchReason: string;
  }>;
}

export interface OptimizeOptions {
  language: 'en' | 'zh';
  provider: 'gemini' | 'glm';
  apiKey?: string;
}

export async function optimizeResumeAndRecommendJobs(resumeText: string, options: OptimizeOptions): Promise<OptimizationResult> {
  const langText = options.language === 'zh' ? 'Chinese (Simplified)' : 'English';
  
  const prompt = `You are an expert career counselor, ATS resume optimizer, and recruiter.
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
${resumeText}
`;

  if (options.provider === 'gemini') {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimizedResume: { type: Type.STRING },
            jobRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  matchScore: { type: Type.NUMBER },
                  matchReason: { type: Type.STRING },
                },
                required: ["title", "description", "matchScore", "matchReason"],
              },
            },
          },
          required: ["optimizedResume", "jobRecommendations"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from Gemini API");
    return JSON.parse(text) as OptimizationResult;
  } else if (options.provider === 'glm') {
    if (!options.apiKey) {
      throw new Error("Zhipu (GLM) API Key is required.");
    }
    
    // Call Zhipu API
    const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${options.apiKey}`
      },
      body: JSON.stringify({
        model: "glm-4",
        messages: [
          { role: "system", content: "You are a helpful assistant that strictly outputs JSON format." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GLM API Error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    let textResult = data.choices?.[0]?.message?.content;
    if (!textResult) throw new Error("Invalid response format from GLM API");
    
    // Clean markdown if present
    textResult = textResult.trim();
    if (textResult.startsWith("```json")) {
      textResult = textResult.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (textResult.startsWith("```")) {
      textResult = textResult.replace(/^```/, '').replace(/```$/, '').trim();
    }

    return JSON.parse(textResult) as OptimizationResult;
  }
  
  throw new Error("Invalid provider");
}
