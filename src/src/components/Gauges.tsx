interface WeightGaugeProps {
  value?: number;
  bmi?: number;
  progress: number;
}

export function WeightGauge({ value, bmi, progress }: WeightGaugeProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const circumference = Math.PI * 112;
  return (
    <div className="relative w-full max-w-[300px] mx-auto">
      <svg viewBox="0 0 300 180" className="w-full">
        <path d="M38 150 A112 112 0 0 1 262 150" fill="none" className="stroke-border" strokeWidth="18" strokeLinecap="round" />
        <path
          d="M38 150 A112 112 0 0 1 262 150"
          fill="none"
          className="stroke-primary"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${circumference * clamped} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-x-0 top-[52px] text-center">
        <p className="text-[11px] text-textMuted">今日体重</p>
        <p className="text-[38px] font-bold leading-tight text-text">
          {value ? value.toFixed(1) : '--.-'}<span className="text-base font-medium ml-1">kg</span>
        </p>
        <p className="text-xs text-textMuted">BMI {bmi ? bmi.toFixed(1) : '--'}</p>
      </div>
    </div>
  );
}

interface ProgressRingProps {
  percent: number;
  label: string;
  sublabel?: string;
  size?: number;
}

export function ProgressRing({ percent, label, sublabel, size = 92 }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" className="stroke-primaryText/45" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          className="stroke-primaryText"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${circumference * (clamped / 100)} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-primaryText">
        <span className="text-lg font-bold leading-none">{label}</span>
        {sublabel && <span className="text-[8px] opacity-80 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
}
