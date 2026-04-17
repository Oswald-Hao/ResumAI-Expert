import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  FileText, 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  Target,
  FileEdit,
  Settings
} from 'lucide-react';
import { optimizeResumeAndRecommendJobs, OptimizationResult } from './services/llm';
import { cn } from './lib/utils';

export default function App() {
  const [resumeText, setResumeText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'optimized' | 'jobs'>('optimized');
  const [error, setError] = useState<string | null>(null);

  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [provider, setProvider] = useState<'gemini' | 'glm'>('gemini');
  const [apiKey, setApiKey] = useState('');

  const handleOptimize = async () => {
    if (!resumeText.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const data = await optimizeResumeAndRecommendJobs(resumeText, {
        language,
        provider,
        apiKey
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing the resume.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans selection:bg-[var(--accent-soft)] selection:text-[var(--accent)] flex flex-col p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 max-w-[1024px] mx-auto w-full">
        <div className="flex items-center space-x-3 text-2xl font-extrabold tracking-[-0.02em]">
          <div className="bg-[var(--accent)] p-2 rounded-xl text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1>Resum<span className="text-[var(--accent)]">AI</span> | 简历专家</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col max-w-[1024px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="bento-card flex-1 min-h-[600px]">
              
              {/* Settings Area */}
              <div className="flex justify-between items-center bg-[var(--bg)] p-3 rounded-lg border border-[var(--border)] mb-4">
                <div className="flex items-center gap-2 text-[var(--ink)] font-bold text-[13px]">
                  <Settings className="w-4 h-4 text-[var(--accent)]" />
                  优化设置
                </div>
                <div className="flex gap-3 items-center">
                  <div className="flex bg-[var(--card-bg)] rounded overflow-hidden border border-[var(--border)]">
                    <button 
                      onClick={() => setLanguage('zh')}
                      className={cn("px-3 py-1 text-[12px] font-bold transition-colors", language === 'zh' ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:text-[var(--ink)]")}
                    >
                      中文
                    </button>
                    <button 
                      onClick={() => setLanguage('en')}
                      className={cn("px-3 py-1 text-[12px] font-bold transition-colors border-l border-[var(--border)]", language === 'en' ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:text-[var(--ink)]")}
                    >
                      EN
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg)] p-3 rounded-lg border border-[var(--border)] mb-6 space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="text-[13px] font-bold text-[var(--ink)]">AI 模型</span>
                   <select 
                     value={provider} 
                     onChange={(e) => setProvider(e.target.value as 'gemini' | 'glm')}
                     className="bg-[var(--card-bg)] border border-[var(--border)] px-2 py-1 rounded text-[12px] font-bold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                   >
                     <option value="gemini">Gemini 3.1 (Default)</option>
                     <option value="glm">Zhipu GLM-4 (API Key)</option>
                   </select>
                 </div>
                 {provider === 'glm' && (
                   <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--border)]">
                      <input 
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="输入您的智谱 GLM API Key..."
                        className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded px-3 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                      />
                   </div>
                 )}
              </div>

              <div className="bento-card-title border-t border-[var(--border)] pt-4 border-dashed">
                <span className="flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-[var(--accent)]" />
                  Your Resume Content
                </span>
                {resumeText.length > 0 && (
                  <span className="text-[10px] bg-[var(--accent-soft)] text-[var(--accent)] px-2 py-0.5 rounded font-semibold">
                    {resumeText.length} CHARS
                  </span>
                )}
              </div>
              
              <div className="flex-1 relative pb-4">
                <textarea
                  className="w-full h-full min-h-[400px] resize-none border border-[var(--border)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] text-[var(--text-main)] placeholder-[var(--text-muted)] p-3 rounded-lg text-[14px] leading-relaxed font-sans bg-[var(--bg)] outline-none transition-all"
                  placeholder="Paste your current resume, LinkedIn profile, or career background here...&#10;&#10;e.g.,&#10;Software Engineer with 3 years of experience in React and Node.js. Developed a scalable microservices architecture that improved performance by 40%. Led a team of 3 developers."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}

              <button
                onClick={handleOptimize}
                disabled={isProcessing || !resumeText.trim()}
                className={cn(
                  "w-full py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-semibold text-[14px] transition-all duration-200 border-none",
                  isProcessing 
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] cursor-not-allowed" 
                    : !resumeText.trim()
                      ? "bg-[var(--bg)] text-[var(--text-muted)] cursor-not-allowed"
                      : "bg-[var(--ink)] text-white hover:opacity-90 active:scale-[0.98]"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing & Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Optimize & Find Matches
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7 flex flex-col h-full">
            {!result && !isProcessing ? (
              <div className="bento-card h-full flex flex-col items-center justify-center text-center border-dashed border-2">
                <div className="w-[120px] h-[120px] rounded-full border-[8px] border-[var(--accent-soft)] border-t-[var(--accent)] flex items-center justify-center mb-6 text-[var(--accent)]">
                  <Target className="w-10 h-10" />
                </div>
                <h3 className="text-[18px] font-bold text-[var(--ink)] mb-2">Ready to level up your career?</h3>
                <p className="text-[14px] text-[var(--text-muted)] max-w-sm text-center leading-relaxed">
                  Paste your resume on the left and our AI will rewrite it for maximum impact and suggest perfect job roles based on your experience.
                </p>
              </div>
            ) : isProcessing ? (
              <div className="bento-card h-[600px] flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-[120px] h-[120px] rounded-full border-[8px] border-[var(--accent-soft)] border-t-[var(--accent)] animate-spin flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-[var(--accent)] animate-pulse" />
                  </div>
                  <h3 className="text-[18px] font-bold text-[var(--ink)] mb-2">Analyzing your profile</h3>
                  <p className="text-[14px] text-[var(--text-muted)] max-w-sm text-center animate-pulse">
                    Crafting compelling bullet points, identifying key skills, and finding the perfect role matches...
                  </p>
                </div>
              </div>
            ) : result && (
              <div className="bento-card flex flex-col h-full overflow-hidden p-0">
                {/* Tabs */}
                <div className="flex border-b border-[var(--border)] bg-[var(--bg)] p-4 gap-2">
                  <button
                    onClick={() => setActiveTab('optimized')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-[14px] transition-all outline-none",
                      activeTab === 'optimized'
                        ? "bg-[var(--card-bg)] text-[var(--accent)] border border-[var(--border)] shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--border)]"
                    )}
                  >
                    <FileText className="w-4 h-4" />
                    Optimized Resume
                  </button>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-[14px] transition-all outline-none",
                      activeTab === 'jobs'
                        ? "bg-[var(--card-bg)] text-[var(--accent)] border border-[var(--border)] shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--ink)] hover:bg-[var(--border)]"
                    )}
                  >
                    <Briefcase className="w-4 h-4" />
                    Job Matches
                    <span className="bg-[var(--accent-soft)] text-[var(--accent)] py-0.5 px-2 rounded-md text-[10px] ml-1 font-bold">
                      {result.jobRecommendations.length}
                    </span>
                  </button>
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto min-h-[500px]">
                  <AnimatePresence mode="wait">
                    {activeTab === 'optimized' && (
                      <motion.div
                        key="optimized"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="prose max-w-none text-[var(--text-main)] prose-headings:text-[var(--ink)] prose-h1:text-[24px] prose-h1:font-extrabold prose-h2:text-[18px] prose-h2:border-b prose-h2:border-[var(--border)] prose-h2:pb-2 prose-h2:mt-6 prose-a:text-[var(--accent)] prose-li:my-0 pb-12 text-[14px] leading-relaxed"
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {result.optimizedResume}
                        </ReactMarkdown>
                      </motion.div>
                    )}

                    {activeTab === 'jobs' && (
                      <motion.div
                        key="jobs"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 pb-12"
                      >
                        {result.jobRecommendations.map((job, idx) => (
                          <div key={idx} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-[16px] font-bold text-[var(--ink)] leading-tight">
                                  {job.title}
                                </h3>
                              </div>
                              <div className="text-[18px] font-bold text-[var(--accent)] flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                {job.matchScore}%
                              </div>
                            </div>
                            
                            <div className="space-y-4 mt-4">
                              <div>
                                <h4 className="flex items-center gap-2 text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Role Overview</h4>
                                <p className="text-[14px] text-[var(--text-main)] leading-relaxed">
                                  {job.description}
                                </p>
                              </div>
                              <div className="pt-2">
                                <h4 className="flex items-center gap-2 text-[12px] font-bold text-[var(--accent)] uppercase tracking-wider mb-2">
                                  <div className="text-[var(--accent)] leading-none text-xl mb-0.5">•</div>
                                  Why You're a Fit
                                </h4>
                                <div className="bg-[var(--accent-soft)] p-4 rounded-xl">
                                  <p className="text-[14px] text-[var(--ink)] leading-relaxed font-medium">
                                    {job.matchReason}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
