import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import { findItem, milestones } from '../data/blindBoxItems';
import type {
  AppState,
  AvatarConfig,
  AvatarState,
  DayLog,
  DrawResult,
  FavoriteLook,
  FoodRecord,
  ReminderSettings,
  WaterCup,
} from '../types';
import { daysBetween, shiftDate, todayKey } from '../utils/date';
import { emptyDayLog, expToNext, initialState, loadState, STORAGE_KEY } from '../utils/constants';

type Action =
  | { type: 'OPEN_APP'; date: string }
  | { type: 'ADD_RECORD'; record: FoodRecord }
  | { type: 'UPDATE_RECORD'; date: string; record: FoodRecord }
  | { type: 'DELETE_RECORD'; date: string; recordId: string }
  | { type: 'MARK_CHEAT'; date: string }
  | { type: 'CRAVING'; result: 'resisted' | 'ate'; date: string }
  | { type: 'UPDATE_AVATAR'; patch: Partial<AvatarConfig> }
  | { type: 'EQUIP'; field: 'outfit' | 'hair' | 'accessory' | 'background' | 'action' | 'bottom' | 'shoes'; itemId: string }
  | { type: 'SET_GOAL'; goal: number }
  | { type: 'SET_HEIGHT'; height: number }
  | { type: 'SET_WEIGHT'; date: string; weight: number }
  | { type: 'SET_WATER_CUP'; cup: WaterCup }
  | { type: 'SET_WATER_GOAL'; goal: number }
  | { type: 'ADD_WATER'; date: string; amount?: number; time?: string }
  | { type: 'UNDO_WATER'; date: string }
  | { type: 'ADD_STEPS'; date: string; steps: number }
  | { type: 'SET_HEALTH_CONNECTED'; connected: boolean }
  | { type: 'CLAIM_CHEER'; date: string }
  | { type: 'ADD_PHOTO'; photo: { date: string; imageDataUrl: string } }
  | { type: 'RESOLVE_PULL'; results: DrawResult[]; cost: number }
  | { type: 'EXCHANGE'; itemId: string }
  | { type: 'CLAIM_MILESTONE'; id: string }
  | { type: 'CLEAR_UNSEEN'; ids?: string[] }
  | { type: 'SAVE_LOOK'; look: FavoriteLook }
  | { type: 'TOGGLE_FAVORITE_LOOK'; id: string; config?: AvatarConfig }
  | { type: 'SET_REMINDERS'; patch: Partial<ReminderSettings> }
  | { type: 'CLEAR_DATA' };

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function earn(state: AppState, date: string, amount: number, reason: string): AppState {
  if (amount <= 0) return state;
  return {
    ...state,
    blindBox: { ...state.blindBox, stars: state.blindBox.stars + amount },
    starLedger: [
      { id: makeId('star'), date, amount, reason },
      ...state.starLedger,
    ].slice(0, 300),
  };
}

function markUnseen(state: AppState, ids: string[]): AppState {
  if (ids.length === 0) return state;
  return { ...state, unseenItems: Array.from(new Set([...state.unseenItems, ...ids])) };
}

function ensureLog(state: AppState, date: string): Record<string, DayLog> {
  if (state.logs[date]) return state.logs;
  return { ...state.logs, [date]: emptyDayLog(date) };
}

function addExp(avatar: AvatarState, amount: number): AvatarState {
  let { level, exp } = avatar;
  exp += amount;
  while (exp >= expToNext(level)) {
    exp -= expToNext(level);
    level += 1;
  }
  return { ...avatar, level, exp };
}

function applyStreak(state: AppState, date: string): AppState {
  const hasRecord = (d: string) => {
    const log = state.logs[d];
    return !!log && (log.records.length > 0 || log.isCheatDay);
  };
  let cursor = hasRecord(date) ? date : shiftDate(date, -1);
  let streak = 0;
  while (hasRecord(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  const bonus = streak >= 7 && !state.streakSevenRewarded;
  const next: AppState = {
    ...state,
    streakDays: streak,
    streakSevenRewarded: state.streakSevenRewarded || bonus,
  };
  return bonus ? earn(next, date, 5, '连续记录 7 天') : next;
}

function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'OPEN_APP': {
      const { date } = action;
      if (state.dailyRewardDates.includes(date)) return state;
      const gap = state.lastOpenDate ? daysBetween(state.lastOpenDate, date) : 99;
      const mood = gap >= 2 ? '想你了' : '开心';
      const base: AppState = {
        ...state,
        logs: ensureLog(state, date),
        lastOpenDate: date,
        dailyRewardDates: [...state.dailyRewardDates, date],
        avatar: addExp({ ...state.avatar, mood }, 5),
      };
      return applyStreak(earn(base, date, 1, '今天见到了分身'), date);
    }
    case 'ADD_RECORD': {
      const logs = ensureLog(state, action.record.date);
      const day = logs[action.record.date];
      const base: AppState = {
        ...state,
        logs: {
          ...logs,
          [action.record.date]: { ...day, records: [...day.records, action.record] },
        },
        totalMealsLogged: state.totalMealsLogged + 1,
        avatar: addExp(
          { ...state.avatar, mood: action.record.calories >= 600 ? '满足地打嗝' : '元气满满' },
          10,
        ),
      };
      const withStar = earn(base, action.record.date, 1, '记录一餐');
      const withHonest = action.record.honestStar
        ? earn(withStar, action.record.date, 1, '如实记录')
        : withStar;
      return applyStreak(withHonest, action.record.date);
    }
    case 'UPDATE_RECORD': {
      const logs = state.logs[action.date];
      if (!logs) return state;
      return {
        ...state,
        logs: {
          ...state.logs,
          [action.date]: {
            ...logs,
            records: logs.records.map((r) => (r.id === action.record.id ? action.record : r)),
          },
        },
      };
    }
    case 'DELETE_RECORD': {
      const logs = state.logs[action.date];
      if (!logs) return state;
      return {
        ...state,
        logs: {
          ...state.logs,
          [action.date]: {
            ...logs,
            records: logs.records.filter((r) => r.id !== action.recordId),
          },
        },
      };
    }
    case 'MARK_CHEAT': {
      const logs = ensureLog(state, action.date);
      const day = logs[action.date];
      if (day.isCheatDay) return state;
      const base: AppState = {
        ...state,
        logs: { ...logs, [action.date]: { ...day, isCheatDay: true, honestRewarded: true } },
        avatar: addExp({ ...state.avatar, mood: '满足地打嗝' }, 0),
      };
      return applyStreak(earn(base, action.date, 1, '如实标记放纵餐'), action.date);
    }
    case 'CRAVING': {
      const logs = ensureLog(state, action.date);
      const day = logs[action.date];
      const resisted = action.result === 'resisted';
      const base: AppState = {
        ...state,
        logs: {
          ...logs,
          [action.date]: { ...day, cravingResisted: day.cravingResisted + (resisted ? 1 : 0) },
        },
        totalCravingsResisted: state.totalCravingsResisted + (resisted ? 1 : 0),
        avatar: addExp(
          { ...state.avatar, mood: resisted ? '为你骄傲' : '陪你一起' },
          resisted ? 15 : 5,
        ),
      };
      return earn(base, action.date, 1, '完成扛馋急救');
    }
    case 'UPDATE_AVATAR':
      return {
        ...state,
        avatar: { ...state.avatar, equipped: { ...state.avatar.equipped, ...action.patch } },
      };
    case 'EQUIP':
      return {
        ...state,
        avatar: {
          ...state.avatar,
          equipped: { ...state.avatar.equipped, [action.field]: action.itemId },
        },
      };
    case 'SET_GOAL':
      return { ...state, calorieGoal: Math.max(800, Math.min(4000, action.goal)) };
    case 'SET_HEIGHT':
      return { ...state, height: Math.max(100, Math.min(230, action.height)) };
    case 'SET_WEIGHT':
      return {
        ...state,
        weightRecords: { ...state.weightRecords, [action.date]: Math.max(20, Math.min(300, action.weight)) },
      };
    case 'SET_WATER_CUP':
      return { ...state, waterCup: action.cup };
    case 'SET_WATER_GOAL':
      return { ...state, waterGoal: Math.max(500, Math.min(5000, action.goal)) };
    case 'ADD_WATER': {
      const amount = Math.max(50, Math.min(2000, action.amount ?? state.waterCup.capacity));
      const log = {
        id: makeId('water'),
        date: action.date,
        time: action.time ?? new Date().toTimeString().slice(0, 5),
        amount,
        cupId: state.waterCup.id,
      };
      const base: AppState = {
        ...state,
        waterLogs: [log, ...state.waterLogs],
        waterByDate: {
          ...state.waterByDate,
          [action.date]: (state.waterByDate[action.date] ?? 0) + 1,
        },
      };
      if (state.waterStarDates.includes(action.date)) return base;
      return earn(
        { ...base, waterStarDates: [...state.waterStarDates, action.date] },
        action.date,
        1,
        '记录饮水',
      );
    }
    case 'UNDO_WATER': {
      const index = state.waterLogs.findIndex((log) => log.date === action.date);
      if (index < 0) return state;
      const logs = [...state.waterLogs];
      logs.splice(index, 1);
      return {
        ...state,
        waterLogs: logs,
        waterByDate: {
          ...state.waterByDate,
          [action.date]: Math.max(0, (state.waterByDate[action.date] ?? 1) - 1),
        },
      };
    }
    case 'ADD_STEPS': {
      const steps = Math.max(0, Math.min(100000, action.steps));
      const base: AppState = {
        ...state,
        stepsByDate: { ...state.stepsByDate, [action.date]: (state.stepsByDate[action.date] ?? 0) + steps },
      };
      if (state.walkStarDates.includes(action.date) || steps < 600) return base;
      return earn(
        { ...base, walkStarDates: [...state.walkStarDates, action.date] },
        action.date,
        1,
        '和我走十分钟',
      );
    }
    case 'SET_HEALTH_CONNECTED':
      return { ...state, healthConnected: action.connected };
    case 'CLAIM_CHEER': {
      if (state.dailyCheerDates.includes(action.date)) return state;
      const base: AppState = {
        ...state,
        dailyCheerDates: [...state.dailyCheerDates, action.date],
        avatar: addExp(state.avatar, 5),
      };
      return earn(base, action.date, 1, '收下今日星星');
    }
    case 'ADD_PHOTO':
      return { ...state, photoTimeline: [action.photo, ...state.photoTimeline] };
    case 'RESOLVE_PULL': {
      const duplicates = action.results.filter((r) => r.isDuplicate).length;
      const newIds = action.results.filter((r) => !r.isDuplicate).map((r) => r.itemId);
      const base: AppState = {
        ...state,
        blindBox: {
          stars: Math.max(0, state.blindBox.stars - action.cost),
          fragments: state.blindBox.fragments + duplicates,
          ownedItems: Array.from(new Set([...state.blindBox.ownedItems, ...newIds])),
        },
        avatar: { ...state.avatar, mood: '拆礼物中' },
        lastBoxResult: action.results,
        lastBoxNewItemId: newIds[0],
      };
      return markUnseen(base, newIds);
    }
    case 'EXCHANGE': {
      if (state.blindBox.fragments < 10 || state.blindBox.ownedItems.includes(action.itemId)) return state;
      const base: AppState = {
        ...state,
        blindBox: {
          ...state.blindBox,
          fragments: state.blindBox.fragments - 10,
          ownedItems: [...state.blindBox.ownedItems, action.itemId],
        },
        lastBoxResult: [{ itemId: action.itemId, isDuplicate: false }],
        lastBoxNewItemId: action.itemId,
      };
      return markUnseen(base, [action.itemId]);
    }
    case 'CLAIM_MILESTONE': {
      if (state.milestonesClaimed.includes(action.id)) return state;
      const def = milestones.find((m) => m.id === action.id);
      if (!def) return state;
      const current =
        def.metric === 'meals'
          ? state.totalMealsLogged
          : def.metric === 'streak'
            ? state.streakDays
            : state.totalCravingsResisted;
      if (current < def.target) return state;
      const base: AppState = {
        ...state,
        milestonesClaimed: [...state.milestonesClaimed, def.id],
        blindBox: {
          ...state.blindBox,
          ownedItems: Array.from(new Set([...state.blindBox.ownedItems, def.rewardItemId])),
        },
        lastBoxResult: [{ itemId: def.rewardItemId, isDuplicate: false }],
        lastBoxNewItemId: def.rewardItemId,
      };
      return markUnseen(base, [def.rewardItemId]);
    }
    case 'CLEAR_UNSEEN':
      return { ...state, unseenItems: action.ids ? state.unseenItems.filter((id) => !action.ids?.includes(id)) : [] };
    case 'SAVE_LOOK':
      return {
        ...state,
        avatar: {
          ...state.avatar,
          equipped: { ...action.look.config },
          mood: '换新装啦',
        },
        unseenItems: state.unseenItems.filter((id) => id !== action.look.id),
      };
    case 'TOGGLE_FAVORITE_LOOK': {
      const exists = state.favoriteLooks.some((look) => look.id === action.id);
      return {
        ...state,
        favoriteLooks: exists
          ? state.favoriteLooks.filter((look) => look.id !== action.id)
          : [...state.favoriteLooks, { id: action.id, name: '我的搭配', config: action.config ?? state.avatar.equipped }],
      };
    }
    case 'SET_REMINDERS':
      return { ...state, reminders: { ...state.reminders, ...action.patch } };
    case 'CLEAR_DATA':
      return initialState();
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  todayLog: DayLog;
  todayTotal: number;
  todayWaterMl: number;
  todayWaterCount: number;
  todayStars: number;
  todaySpend: number;
  todayMeals: number;
  todaySteps: number;
  todayWeight?: number;
  remaining: number;
  limitedUnlocked: boolean;
  ownedItemNames: string[];
  hasUnseenReward: boolean;
  notice: string;
  notify: (message: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reduce, undefined, loadState);
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef<number | undefined>(undefined);

  const notify = useCallback((message: string) => {
    setNotice(message);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 1800);
  }, []);

  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // file:// 下部分浏览器禁用本地存储时忽略
    }
  }, [state]);

  useEffect(() => {
    dispatch({ type: 'OPEN_APP', date: todayKey() });
  }, []);

  const value = useMemo<AppContextValue>(() => {
    const today = todayKey();
    const todayLog = state.logs[today] ?? emptyDayLog(today);
    const todayTotal = todayLog.records.reduce((sum, r) => sum + r.calories, 0);
    const todayWaterLogs = state.waterLogs.filter((log) => log.date === today);
    const weightDates = Object.keys(state.weightRecords).filter((d) => d <= today).sort();
    const todayWeight = weightDates.length > 0 ? state.weightRecords[weightDates[weightDates.length - 1]] : undefined;
    return {
      state,
      dispatch,
      todayLog,
      todayTotal,
      todayWaterMl: todayWaterLogs.reduce((sum, log) => sum + log.amount, 0),
      todayWaterCount: todayWaterLogs.length,
      todayStars: state.starLedger.filter((entry) => entry.date === today).reduce((sum, entry) => sum + entry.amount, 0),
      todaySpend: todayLog.records.reduce((sum, r) => sum + (r.amount ?? 0), 0),
      todayMeals: todayLog.records.length,
      todaySteps: state.stepsByDate[today] ?? 0,
      todayWeight,
      remaining: state.calorieGoal - todayTotal,
      limitedUnlocked: state.milestonesClaimed.length > 0,
      ownedItemNames: state.blindBox.ownedItems.map((id) => findItem(id)?.name ?? id),
      hasUnseenReward: state.unseenItems.length > 0,
      notice,
      notify,
    };
  }, [state, notice, notify]);

  return (
    <AppContext.Provider value={value}>
      {children}
      {notice && (
        <div className="pointer-events-none fixed left-1/2 top-5 z-[80] -translate-x-1/2 rounded-2xl bg-ink px-4 py-2.5 text-[13px] text-white shadow-modal animate-pop-in">
          {notice}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
