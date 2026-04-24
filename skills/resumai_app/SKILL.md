---
name: "resumai-builder"
description: >
  Provides instructions and code templates to generate a Resume Optimization and 
  Job Recommendation System (ResumAI). Use this skill when a user asks to build 
  an AI-powered resume tool, job matcher, or wants to recreate the Bento Grid 
  resume application. It includes multi-model support (Gemini & Zhipu GLM), 
  bilingual output (EN/ZH), and a Bento Grid UI.
---

# ResumAI App Builder Skill

When the user asks to build the ResumAI app, a resume optimizer, or a job matching application, follow these guidelines and use the provided code snippets to build the complete application.

## 1. Dependencies

Make sure to install the following dependencies via `install_applet_package`:
- `lucide-react` (icons)
- `framer-motion` (animations)
- `react-markdown`, `remark-gfm` (markdown rendering)
- `@tailwindcss/typography` (markdown styling)
- `clsx`, `tailwind-merge` (utility styling)
- `@google/genai` (Gemini SDK)

## 2. Core Styling (`src/index.css`)

The app uses a strict "Bento Grid" aesthetic. Append this to `src/index.css`:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --font-sans: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Helvetica, Arial, sans-serif;
}

:root {
  --bg: #F0F2F5;
  --ink: #0F172A;
  --accent: #4F46E5;
  --accent-soft: #EEF2FF;
  --border: #E2E8F0;
  --card-bg: #FFFFFF;
  --text-main: #334155;
  --text-muted: #64748B;
}

body {
  background-color: var(--bg);
  color: var(--ink);
}

.bento-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.bento-card-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

## 3. Utility Function (`src/lib/utils.ts`)

Create standard style merger for React components:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## 4. LLM Service (`src/services/llm.ts`)

Create a service that dynamically routes requests to either Gemini or Zhipu GLM, and forces the desired output language.

```typescript
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
  
  const prompt = \`You are an expert career counselor, ATS resume optimizer, and recruiter.
I will provide you with a user's resume or career background.

Please do the following:
1. Provide a highly optimized version of the resume in Markdown format. The optimized resume should use strong action verbs, quantifiable metrics where possible, and clear formatting (Summary, Experience, Education, Skills). Enhance the language to sound more professional and impactful.
2. Recommend 3-5 suitable job roles for this person.
3. IMPORTANT: All your output, including the optimized resume, job titles, descriptions, and reasoning MUST be entirely in \${langText}.

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
\${resumeText}
\`;

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
    if (!options.apiKey) throw new Error("Zhipu (GLM) API Key is required.");
    
    // Call Zhipu API
    const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${options.apiKey}\`
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
      throw new Error(\`GLM API Error \${res.status}: \${errText}\`);
    }

    const data = await res.json();
    let textResult = data.choices?.[0]?.message?.content;
    if (!textResult) throw new Error("Invalid response format from GLM API");
    
    textResult = textResult.trim();
    if (textResult.startsWith("\`\`\`json")) {
      textResult = textResult.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
    } else if (textResult.startsWith("\`\`\`")) {
      textResult = textResult.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
    }

    return JSON.parse(textResult) as OptimizationResult;
  }
  
  throw new Error("Invalid provider");
}
```

## 5. Main Component (`src/App.tsx`)

Build the frontend UI integrating state, animations, tabs, multi-language toggles, and LLM providers. Ensure to import layout icons from `lucide-react` (like `Settings`, `FileEdit`, `Target`, `TrendingUp`, `Sparkles`, `FileText`, `Briefcase`). Use a CSS-grid `lg:grid-cols-12` approach.

Example key layout logic:
- A `header` at the top with branding.
- A `main` container split into `lg:col-span-5` (input column) and `lg:col-span-7` (output column).
- The input column features: Settings Area (Language toggle 'zh' / 'en', Model Select 'gemini' / 'glm', API key field when GLM is active) and a large `textarea` to input the resume.
- The output column features: 
    - Empty state (Target Icon).
    - Loading State (Spinning loader with messages).
    - Success state: Tab setup for "Optimized Resume" (rendered with `react-markdown`) and "Job Matches" (Cards iterating `result.jobRecommendations`).

## Output Checklist
- [ ] Dependencies have been installed.
- [ ] CSS custom properties and `.bento-card` have been added to `index.css`.
- [ ] `utils.ts` created for Tailwind classes.
- [ ] `gemini` & `glm` AI service setup successfully.
- [ ] Main frontend UI uses layout tokens (e.g. `bg-[var(--bg)]`) and Bento layout.
