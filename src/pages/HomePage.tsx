import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { getContextLine, getGreetingByHour } from '../data/avatarLines';
import { todayKey } from '../utils/date';
import { shiftDate } from '../utils/date';

const pad = (n: number) => String(n).padStart(2, '0');
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

export default function HomePage() {
  const {
    state,
    dispatch,
    todayLog,
    todayTotal,
    todayWaterMl,
    todayStars,
    todaySteps,
    todayWeight,
    todayMeals,
    notify,
  } = useApp();
  const today = todayKey();
  const navigate = useNavigate();
  const [anchorDate, setAnchorDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => Number(today.slice(0, 4)));
  const [pickerMonth, setPickerMonth] = useState(() => Number(today.slice(5, 7)));
  const [weightOpen, setWeightOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [lineSeed, setLineSeed] = useState(0);
  const [interactionLine, setInteractionLine] = useState(() =>
    getContextLine(state.avatar.equipped.personality, {
      hour: new Date().getHours(),
      meals: todayMeals,
      waterMl: todayWaterMl,
      stars: todayStars,
      cheat: todayLog.isCheatDay,
    }),
  );

  const dates = Array.from({ length: 7 }, (_, i) => shiftDate(anchorDate, i - 3));

  const refreshLine = () => {
    setInteractionLine(
      getContextLine(state.avatar.equipped.personality, {
        hour: new Date().getHours(),
        meals: todayMeals,
        waterMl: todayWaterMl,
        stars: todayStars,
        cheat: todayLog.isCheatDay,
      }),
    );
    setLineSeed((s) => s + 1);
  };

  const moveWeek = (offset: number) => {
    const next = shiftDate(anchorDate, offset * 7);
    setAnchorDate(next);
    setSelectedDate(next);
  };

  const openPicker = () => {
    setPickerYear(Number(anchorDate.slice(0, 4)));
    setPickerMonth(Number(anchorDate.slice(5, 7)));
    setPickerOpen(true);
  };

  const applyPicker = () => {
    const key = `${pickerYear}-${pad(pickerMonth)}-01`;
    setAnchorDate(key);
    setSelectedDate(key);
    setPickerOpen(false);
    notify(`已切换到 ${pickerYear}年${pickerMonth}月`);
  };

  const addWater = () => {
    dispatch({ type: 'ADD_WATER', date: today });
    notify(`记下一杯 ${state.waterCup.capacity}ml`);
    refreshLine();
  };

  const walkWithAvatar = () => {
    dispatch({ type: 'ADD_STEPS', date: today, steps: 600 });
    notify(state.walkStarDates.includes(today) ? '又陪我走了一段，真好' : '走完十分钟，收到一颗星');
    refreshLine();
  };

  const openWeight = () => {
    setWeightInput(todayWeight ? todayWeight.toFixed(1) : '');
    setWeightOpen(true);
  };

  const saveWeight = () => {
    const value = Number(weightInput);
    if (!value || value <= 0) {
      notify('填一个数字就可以啦');
      return;
    }
    dispatch({ type: 'SET_WEIGHT', date: today, weight: value });
    setWeightOpen(false);
    notify('体重已收好，只作为你的参考');
  };

  return (
    <div className="space-y-4 px-4 pb-8 pt-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="muted">{getGreetingByHour(new Date().getHours())}</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">今天也慢慢来</h1>
        </div>
        <span className="chip shrink-0 bg-avocadoSoft text-xs font-medium text-avocadoInk">馋伴 · 陪你记录</span>
      </header>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">这一周</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => moveWeek(-1)} className="icon-btn h-8 w-8" aria-label="上一周">
              <Icon name="chevronLeft" size={17} />
            </button>
            <button onClick={openPicker} className="chip bg-warm px-2.5 py-1.5 text-xs text-ink" aria-label="选择年月">
              {anchorDate.slice(0, 4)}年{Number(anchorDate.slice(5, 7))}月
            </button>
            <button onClick={() => moveWeek(1)} className="icon-btn h-8 w-8" aria-label="下一周">
              <Icon name="chevronRight" size={17} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dates.map((date) => {
            const active = date === selectedDate;
            const isToday = date === today;
            const hasMark = !!state.logs[date]?.records.length || state.waterLogs.some((log) => log.date === date);
            const weekday = weekdays[new Date(`${date}T00:00:00`).getDay()];
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center rounded-2xl py-2 transition-all duration-150 active:scale-95 ${
                  active ? 'bg-avocado text-avocadoInk shadow-card' : 'bg-white text-ink hover:bg-warm'
                }`}
                aria-label={`${date}${hasMark ? '，有记录' : ''}`}
              >
                <span className={`text-[10px] ${active ? 'text-avocadoInk/70' : 'text-muted'}`}>{weekday}</span>
                <span className="mt-0.5 text-sm font-semibold">{Number(date.slice(-2))}</span>
                <span className={`mt-1 h-1.5 w-1.5 rounded-full ${active ? 'bg-avocadoInk' : hasMark ? 'bg-avocado' : 'bg-transparent'}`} />
                {isToday && !active && <span className="mt-0.5 text-[8px] text-avocadoInk">今</span>}
              </button>
            );
          })}
        </div>
        <p className="muted text-center">
          {selectedDate === today ? '今天' : selectedDate} · {state.logs[selectedDate]?.records.length ?? 0} 条记录
        </p>
      </section>

      <section className="card-important relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="chip bg-warm text-xs text-avocadoInk">Lv.{state.avatar.level} · {state.avatar.equipped.name}</span>
          <span className="chip bg-coralSoft text-xs font-medium text-coralInk">今日 +{todayStars} 星</span>
        </div>
        <button onClick={refreshLine} className="mx-auto block py-1 animate-idle" aria-label="和小馋互动">
          <Avatar config={state.avatar.equipped} size={220} />
        </button>
        <p key={lineSeed} className="mx-auto max-w-[280px] text-center text-sm leading-relaxed text-ink/80 animate-pop-in">
          “{interactionLine}”
        </p>
        <button onClick={() => navigate('/record')} className="btn-primary mt-4 w-full">
          <span className="inline-flex items-center justify-center gap-2">
            <Icon name="camera" size={17} />
            记录这一餐
          </span>
        </button>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={addWater} className="card flex flex-col items-center gap-1 py-3 text-xs text-ink active:scale-95">
          <Icon name="cup" size={20} className="text-avocadoInk" />
          记一杯
        </button>
        <button onClick={walkWithAvatar} className="card flex flex-col items-center gap-1 py-3 text-xs text-ink active:scale-95">
          <Icon name="walk" size={20} className="text-avocadoInk" />
          走十分钟
        </button>
        <button
          onClick={() => navigate('/record', { state: { focus: 'photo' } })}
          className="card flex flex-col items-center gap-1 py-3 text-xs text-ink active:scale-95"
        >
          <Icon name="camera" size={20} className="text-avocadoInk" />
          拍照识别
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3">
          <p className="muted">今日摄入</p>
          <p className="mt-2 text-lg font-bold text-ink">{todayTotal}</p>
          <p className="muted">/ {state.calorieGoal} kcal</p>
        </div>
        <div className="card p-3">
          <p className="muted">今日步数</p>
          <p className="mt-2 text-lg font-bold text-ink">{todaySteps}</p>
          <p className="muted">陪分身走走</p>
        </div>
        <button onClick={openWeight} className="card p-3 text-left active:scale-95">
          <p className="muted">体重参考</p>
          <p className="mt-2 text-lg font-bold text-ink">{todayWeight ?? '—'}</p>
          <p className="muted">{todayWeight ? 'kg · 点此更新' : '点此记录'}</p>
        </button>
      </div>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="选择年月">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-warm px-3 py-2">
            <button onClick={() => setPickerYear((y) => y - 1)} className="icon-btn h-8 w-8" aria-label="上一年">
              <Icon name="chevronLeft" size={17} />
            </button>
            <span className="text-base font-semibold text-ink">{pickerYear} 年</span>
            <button onClick={() => setPickerYear((y) => y + 1)} className="icon-btn h-8 w-8" aria-label="下一年">
              <Icon name="chevronRight" size={17} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <button
                key={month}
                onClick={() => setPickerMonth(month)}
                className={`rounded-2xl py-2.5 text-sm transition-colors active:scale-95 ${
                  pickerMonth === month ? 'bg-avocado text-avocadoInk font-semibold' : 'bg-warm text-muted'
                }`}
              >
                {month}月
              </button>
            ))}
          </div>
          <button onClick={applyPicker} className="btn-primary w-full">去这个月看看</button>
        </div>
      </Modal>

      <Modal open={weightOpen} onClose={() => setWeightOpen(false)} title="今天的体重">
        <div className="space-y-4">
          <p className="muted leading-relaxed">只是一个温柔的参考数字，不会用来评判你。</p>
          <input
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="例如 58.5"
            inputMode="decimal"
            className="w-full rounded-2xl bg-warm px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-avocado/30"
          />
          <button onClick={saveWeight} className="btn-primary w-full">保存</button>
        </div>
      </Modal>
    </div>
  );
}
