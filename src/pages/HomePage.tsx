import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { WeightGauge } from '../components/Gauges';
import Modal from '../components/Modal';
import { getAvatarLine, greetingLines } from '../data/avatarLines';
import { useApp } from '../context/AppContext';
import { DEFAULT_EQUIPPED } from '../utils/constants';
import { formatDateCN, shiftDate, todayKey } from '../utils/date';

export default function HomePage() {
  const { state, dispatch } = useApp();
  const today = todayKey();
  const [anchorDate, setAnchorDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weightOpen, setWeightOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [greetingSeed] = useState(() => Math.floor(Math.random() * greetingLines.length));
  const [lineSeed, setLineSeed] = useState(0);
  const [interactionLine, setInteractionLine] = useState(() => getAvatarLine(state.avatar.equipped.personality));

  const dates = Array.from({ length: 7 }, (_, i) => shiftDate(anchorDate, i - 3));
  const weight = state.weightRecords[selectedDate];
  const heightInMeter = state.height / 100;
  const bmi = weight ? weight / (heightInMeter * heightInMeter) : undefined;
  const progress = weight ? Math.min(1, weight / 110) : 0.28;

  const openWeight = () => {
    setWeightInput(weight ? weight.toFixed(1) : '');
    setWeightOpen(true);
  };

  const saveWeight = () => {
    const value = Number(weightInput);
    if (!value || value <= 0) return;
    dispatch({ type: 'SET_WEIGHT', date: selectedDate, weight: value });
    setWeightOpen(false);
  };

  const tapAvatar = () => {
    setInteractionLine(getAvatarLine(state.avatar.equipped.personality));
    setLineSeed((s) => s + 1);
  };

  return (
    <div className="px-4 pt-6 pb-8 space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <p className="muted">{formatDateCN(today)}</p>
          <h1 className="text-2xl font-bold mt-1">你好呀，今天也慢慢来</h1>
        </div>
        <span className="bg-avocadoSoft text-avocadoDark rounded-full px-3 py-1.5 text-[11px] font-medium">
          馋伴 · 陪你记录
        </span>
      </header>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">这一周</h2>
          <div className="flex items-center gap-2 text-xs text-avocadoDark">
            <button onClick={() => setAnchorDate((d) => shiftDate(d, -7))}>‹</button>
            <button onClick={() => setAnchorDate(today)}>今天</button>
            <button onClick={() => setAnchorDate((d) => shiftDate(d, 7))}>›</button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {dates.map((date) => {
            const active = date === selectedDate;
            const hasWeight = !!state.weightRecords[date];
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`min-w-[44px] rounded-2xl py-2 text-center transition-colors ${
                  active ? 'bg-avocado text-white shadow-pop' : 'bg-cream text-ink'
                }`}
              >
                <span className={`block text-[10px] ${active ? 'text-white/80' : 'text-muted'}`}>
                  {['日', '一', '二', '三', '四', '五', '六'][new Date(`${date}T00:00:00`).getDay()]}
                </span>
                <span className="block text-sm font-semibold mt-0.5">{Number(date.slice(-2))}</span>
                <span className={`block text-[8px] mt-1 h-1.5 ${active ? 'text-white' : hasWeight ? 'text-avocado' : 'text-transparent'}`}>●</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card space-y-1">
        <div className="flex items-center justify-between pt-1">
          <h2 className="section-title">{formatDateCN(selectedDate, false)} · 体重仪表盘</h2>
          <button onClick={openWeight} className="text-xs text-avocadoDark">修改 ›</button>
        </div>
        <WeightGauge value={weight} bmi={bmi} progress={progress} />
        <p className="text-center text-xs text-muted pb-2">
          {weight ? '数字只是参考，我们看的是你一直在照顾自己。' : '点一下仪表盘，记下今天的体重吧。'}
        </p>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">分身的变化</h2>
          <span className="muted">左边是起点，右边是现在</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={tapAvatar} className="rounded-3xl bg-cream p-2 text-center">
            <div className="opacity-40 grayscale">
              <Avatar config={{ ...DEFAULT_EQUIPPED, name: state.avatar.equipped.name }} size={140} />
            </div>
            <p className="text-xs text-muted mt-1">初始体型</p>
          </button>
          <button onClick={tapAvatar} className="rounded-3xl bg-avocadoSoft/70 p-2 text-center">
            <Avatar config={state.avatar.equipped} size={140} />
            <p className="text-xs text-avocadoDark font-medium mt-1">当前分身</p>
          </button>
        </div>
        <p key={lineSeed} className="text-sm text-center text-ink/75 bg-cream rounded-2xl p-3 animate-pop-in">
          “{interactionLine}”
        </p>
        <div className="flex items-center justify-between">
          <p className="muted">{state.avatar.equipped.name} · Lv.{state.avatar.level} · {state.avatar.mood}</p>
          <Link to="/avatar" className="btn-primary text-xs">去抽盲盒 →</Link>
        </div>
      </section>

      <section className="rounded-3xl bg-coral/20 p-4">
        <p className="text-xs text-ink/70">今日的小提醒</p>
        <p className="text-sm font-medium mt-1">{greetingLines[greetingSeed]}</p>
        <p className="muted mt-2">对自己温柔一点，今天也会慢慢变好。</p>
      </section>

      <Modal open={weightOpen} onClose={() => setWeightOpen(false)} title={`${formatDateCN(selectedDate, false)} 的体重`}>
        <div className="space-y-4">
          <p className="muted">只用于生成 BMI 和趋势图，不会评判你。</p>
          <input
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="例如 58.5"
            inputMode="decimal"
            className="w-full bg-cream rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-avocado/30"
          />
          <button onClick={saveWeight} className="btn-primary w-full text-sm">保存体重</button>
        </div>
      </Modal>
    </div>
  );
}
