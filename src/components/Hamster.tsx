interface Props {
  size?: number;
  className?: string;
  mood?: 'happy' | 'thinking' | 'cheer';
}

const faces = {
  happy: '🐹',
  thinking: '🐹',
  cheer: '🐹',
};

export default function Hamster({ size = 48, className = '', mood = 'happy' }: Props) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full bg-yellowSoft shadow-card ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.58), lineHeight: 1 }}
      role="img"
      aria-label="小馋仓鼠"
    >
      <span className={mood === 'cheer' ? 'animate-idle' : ''}>{faces[mood]}</span>
    </span>
  );
}
