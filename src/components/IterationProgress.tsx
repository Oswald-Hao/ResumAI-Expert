import { motion } from 'framer-motion';
import { OptimizationStage } from '../services/types';
import {
  Search,
  Wrench,
  Sparkles,
  BarChart3,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

const STAGES: { key: OptimizationStage; label: string; icon: React.ReactNode }[] = [
  { key: 'analyzing_weaknesses', label: '弱点分析', icon: <Search className="w-4 h-4" /> },
  { key: 'building_prompt', label: '构建提示', icon: <Wrench className="w-4 h-4" /> },
  { key: 'generating', label: '生成优化', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'scoring', label: '质量评分', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'iterating', label: '迭代优化', icon: <RefreshCw className="w-4 h-4" /> },
];

const STAGE_ORDER: OptimizationStage[] = [
  'analyzing_weaknesses',
  'building_prompt',
  'generating',
  'scoring',
  'iterating',
];

interface Props {
  stage: OptimizationStage | null;
  detail: string;
  currentRound?: number;
  maxRounds?: number;
}

export default function IterationProgress({ stage, detail, currentRound = 1, maxRounds = 3 }: Props) {
  const isComplete = stage === 'complete';
  const activeIndex = isComplete
    ? STAGES.length
    : stage
      ? STAGE_ORDER.indexOf(stage)
      : -1;

  return (
    <div className="flex flex-col items-center justify-center h-full py-8">
      <div className="w-[120px] h-[120px] rounded-full border-[8px] border-[var(--accent-soft)] border-t-[var(--accent)] animate-spin flex items-center justify-center mb-8">
        <Sparkles className="w-8 h-8 text-[var(--accent)] animate-pulse" />
      </div>

      <h3 className="text-[18px] font-bold text-[var(--ink)] mb-2">多轮迭代优化中</h3>
      <p className="text-[14px] text-[var(--accent)] font-semibold mb-6">
        第 {currentRound}/{maxRounds} 轮
      </p>

      <div className="flex items-center gap-1 mb-4">
        {STAGES.map((s, i) => {
          const isDone = i < activeIndex || isComplete;
          const isActive = i === activeIndex && !isComplete;

          return (
            <div key={s.key} className="flex items-center">
              <motion.div
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all
                  ${isDone ? 'bg-[var(--accent)] text-white' : ''}
                  ${isActive ? 'bg-[var(--accent-soft)] text-[var(--accent)] ring-2 ring-[var(--accent)]' : ''}
                  ${!isDone && !isActive ? 'bg-[var(--bg)] text-[var(--text-muted)]' : ''}
                `}
                animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {isDone && !isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </motion.div>
              {i < STAGES.length - 1 && (
                <div className={`w-4 h-0.5 mx-0.5 ${isDone ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[13px] text-[var(--text-muted)] animate-pulse mt-2">{detail}</p>
    </div>
  );
}
