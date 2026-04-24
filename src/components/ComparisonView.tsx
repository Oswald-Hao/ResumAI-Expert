import { IterativeOptimizationResult, CompositeMetrics } from '../services/types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

const METRIC_LABELS: Record<keyof Omit<CompositeMetrics, never>, { label: string; format: (v: number) => string; higherBetter: boolean }> = {
  actionVerbRatio: { label: '动作动词率', format: v => `${(v * 100).toFixed(1)}%`, higherBetter: true },
  quantificationDensity: { label: '量化密度', format: v => `${(v * 100).toFixed(1)}%`, higherBetter: true },
  avgSentenceLength: { label: '平均句长', format: v => v.toFixed(1), higherBetter: false },
  passiveVoiceRatio: { label: '被动语态率', format: v => `${(v * 100).toFixed(1)}%`, higherBetter: false },
  keywordCoverage: { label: '关键词覆盖', format: v => `${(v * 100).toFixed(1)}%`, higherBetter: true },
  structuralCompleteness: { label: '结构完整性', format: v => `${(v * 100).toFixed(1)}%`, higherBetter: true },
  coherenceScore: { label: '连贯性得分', format: v => `${(v * 100).toFixed(1)}%`, higherBetter: true },
  compositeScore: { label: '综合得分', format: v => `${(v * 100).toFixed(1)}%`, higherBetter: true },
};

const RADAR_AXES = [
  'actionVerbRatio',
  'quantificationDensity',
  'passiveVoiceRatio',
  'keywordCoverage',
  'structuralCompleteness',
  'coherenceScore',
  'compositeScore',
] as const;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildRadarPath(values: number[], cx: number, cy: number, radius: number): string {
  const n = values.length;
  return values
    .map((v, i) => {
      const angle = (360 / n) * i;
      const r = radius * Math.max(v, 0.05);
      const p = polarToCartesian(cx, cy, r, angle);
      return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    })
    .join(' ') + ' Z';
}

function DeltaIcon({ delta, higherBetter }: { delta: number; higherBetter: boolean }) {
  const positive = delta > 0;
  const improved = higherBetter ? positive : !positive;
  if (Math.abs(delta) < 0.001) return <Minus className="w-3.5 h-3.5 text-[var(--text-muted)]" />;
  return improved
    ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
    : <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
}

interface Props {
  data: IterativeOptimizationResult;
}

export default function ComparisonView({ data }: Props) {
  const { comparison, iterationHistory, weaknesses } = data;
  const { beforeMetrics, afterMetrics, delta } = comparison;

  const radarSize = 220;
  const cx = radarSize / 2;
  const cy = radarSize / 2;
  const radius = 85;

  const beforeValues = RADAR_AXES.map(k => {
    const v = beforeMetrics[k];
    return k === 'passiveVoiceRatio' ? 1 - v : v;
  });
  const afterValues = RADAR_AXES.map(k => {
    const v = afterMetrics[k];
    return k === 'passiveVoiceRatio' ? 1 - v : v;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Weakness Summary */}
      <div className="bg-[var(--bg)] rounded-xl p-4 border border-[var(--border)]">
        <h4 className="text-[13px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          检测到的简历弱点
        </h4>
        <div className="flex flex-wrap gap-2">
          {weaknesses.weakActionVerbs && (
            <span className="text-[12px] bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-medium">动作动词不足</span>
          )}
          {weaknesses.lacksQuantification && (
            <span className="text-[12px] bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-medium">缺乏量化指标</span>
          )}
          {weaknesses.excessivePassiveVoice && (
            <span className="text-[12px] bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-medium">被动语态过多</span>
          )}
          {weaknesses.missingSections.map(s => (
            <span key={s} className="text-[12px] bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-medium">缺少: {s}</span>
          ))}
          {weaknesses.keywordGaps.slice(0, 5).map(k => (
            <span key={k} className="text-[12px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">缺少: {k}</span>
          ))}
        </div>
        <p className="text-[13px] text-[var(--text-main)] mt-3 leading-relaxed">{weaknesses.overallAssessment}</p>
      </div>

      {/* Radar Chart + Metrics Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar Chart */}
        <div className="bg-[var(--bg)] rounded-xl p-4 border border-[var(--border)] flex flex-col items-center">
          <h4 className="text-[13px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 self-start">
            质量指标雷达图
          </h4>
          <svg width={radarSize} height={radarSize} viewBox={`0 0 ${radarSize} ${radarSize}`}>
            {/* Grid circles */}
            {[0.25, 0.5, 0.75, 1].map(level => (
              <circle key={level} cx={cx} cy={cy} r={radius * level} fill="none" stroke="var(--border)" strokeWidth={0.5} />
            ))}
            {/* Axis lines */}
            {RADAR_AXES.map((_, i) => {
              const p = polarToCartesian(cx, cy, radius, (360 / RADAR_AXES.length) * i);
              return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={0.5} />;
            })}
            {/* Before polygon */}
            <path d={buildRadarPath(beforeValues, cx, cy, radius)} fill="rgba(148,163,184,0.15)" stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="4 2" />
            {/* After polygon */}
            <path d={buildRadarPath(afterValues, cx, cy, radius)} fill="rgba(79,70,229,0.15)" stroke="var(--accent)" strokeWidth={2} />
            {/* Axis labels */}
            {RADAR_AXES.map((key, i) => {
              const labelCfg = METRIC_LABELS[key];
              const angle = (360 / RADAR_AXES.length) * i;
              const labelR = radius + 20;
              const p = polarToCartesian(cx, cy, labelR, angle);
              return (
                <text key={key} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="var(--text-muted)" fontWeight={600}>
                  {labelCfg.label}
                </text>
              );
            })}
          </svg>
          <div className="flex gap-4 mt-2 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[var(--text-muted)] inline-block" style={{ borderTop: '2px dashed var(--text-muted)' }} /> 优化前
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[var(--accent)] inline-block border-t-2 border-[var(--accent)]" /> 优化后
            </span>
          </div>
        </div>

        {/* Metrics Table */}
        <div className="bg-[var(--bg)] rounded-xl p-4 border border-[var(--border)]">
          <h4 className="text-[13px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            指标前后对比
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 pr-3 text-[var(--text-muted)] font-bold">指标</th>
                  <th className="text-right py-2 px-3 text-[var(--text-muted)] font-bold">优化前</th>
                  <th className="text-right py-2 px-3 text-[var(--text-muted)] font-bold">优化后</th>
                  <th className="text-right py-2 pl-3 text-[var(--text-muted)] font-bold">变化</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(METRIC_LABELS) as Array<keyof CompositeMetrics>).map(key => {
                  const cfg = METRIC_LABELS[key];
                  const bVal = beforeMetrics[key];
                  const aVal = afterMetrics[key];
                  const d = delta[key];
                  return (
                    <tr key={key} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2 pr-3 font-medium text-[var(--ink)]">{cfg.label}</td>
                      <td className="text-right py-2 px-3 text-[var(--text-muted)]">{cfg.format(bVal)}</td>
                      <td className="text-right py-2 px-3 font-semibold text-[var(--ink)]">{cfg.format(aVal)}</td>
                      <td className="text-right py-2 pl-3">
                        <span className="inline-flex items-center gap-1">
                          <DeltaIcon delta={d} higherBetter={cfg.higherBetter} />
                          <span className={cfg.higherBetter ? (d > 0 ? 'text-emerald-500' : 'text-red-400') : (d < 0 ? 'text-emerald-500' : 'text-red-400')}>
                            {d > 0 ? '+' : ''}{cfg.format(Math.abs(d))}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Iteration Score Curve */}
      <div className="bg-[var(--bg)] rounded-xl p-4 border border-[var(--border)]">
        <h4 className="text-[13px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          迭代得分曲线 (共 {iterationHistory.length} 轮)
        </h4>
        <div className="h-[120px] relative">
          <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1].map(level => (
              <line key={level} x1="40" y1={110 - level * 90} x2="390" y2={110 - level * 90} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="4 2" />
            ))}
            {/* Y-axis labels */}
            {[0, 25, 50, 75, 100].map(v => (
              <text key={v} x="35" y={113 - (v / 100) * 90} textAnchor="end" fontSize={9} fill="var(--text-muted)">{v}</text>
            ))}
            {/* Line */}
            {iterationHistory.length > 1 && (
              <polyline
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={iterationHistory.map((rec, i) => {
                  const x = 40 + (i / (Math.max(iterationHistory.length - 1, 1))) * 350;
                  const y = 110 - rec.metrics.compositeScore * 90;
                  return `${x},${y}`;
                }).join(' ')}
              />
            )}
            {/* Dots */}
            {iterationHistory.map((rec, i) => {
              const x = 40 + (i / (Math.max(iterationHistory.length - 1, 1))) * 350;
              const y = 110 - rec.metrics.compositeScore * 90;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={5} fill="var(--accent)" />
                  <text x={x} y={y - 10} textAnchor="middle" fontSize={10} fill="var(--accent)" fontWeight={700}>
                    {(rec.metrics.compositeScore * 100).toFixed(0)}%
                  </text>
                  <text x={x} y={110 + 10} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
                    R{rec.round}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Optimization Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--accent-soft)] rounded-xl p-4 text-center">
          <div className="text-[24px] font-extrabold text-[var(--accent)]">{iterationHistory.length}</div>
          <div className="text-[12px] text-[var(--text-muted)] font-medium mt-1">迭代轮次</div>
        </div>
        <div className="bg-[var(--accent-soft)] rounded-xl p-4 text-center">
          <div className="text-[24px] font-extrabold text-[var(--accent)]">{data.totalLLMCalls}</div>
          <div className="text-[12px] text-[var(--text-muted)] font-medium mt-1">LLM调用次数</div>
        </div>
        <div className="bg-[var(--accent-soft)] rounded-xl p-4 text-center">
          <div className="text-[24px] font-extrabold text-[var(--accent)]">{(data.totalTimeMs / 1000).toFixed(1)}s</div>
          <div className="text-[12px] text-[var(--text-muted)] font-medium mt-1">总耗时</div>
        </div>
      </div>
    </div>
  );
}
