import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { findItem, milestones } from '../data/blindBoxItems';
import type {
  AppState,
  AvatarConfig,
  AvatarState,
  DayLog,
  DrawResult,
  FoodRecord,
} from '../types';
import { daysBetween, shiftDate, todayKey } from '../utils/date';
import { emptyDayLog, expToNext, initialState, loadState, STORAGE_KEY } from '../utils/constants';

type Action =
  | { type: 'OPEN_APP'; date: string }
  | { type: 'ADD_RECORD'; record: FoodRecord }
  | { type: 'MARK_CHEAT'; date: string }
  | { type: 'EXERCISE' }
  | { type: 'CRAVING'; result: 'resisted' | 'ate'; date: string }
  | { type: 'UPDATE_AVATAR'; patch: Partial<AvatarConfig> }
  | { type: 'EQUIP'; field: 'outfit' | 'hair' | 'accessory' | 'background' | 'action'; itemId: string }
  | { type: 'SET_GOAL'; goal: number }
  | { type: 'ADD_PHOTO'; photo: { date: string; imageDataUrl: string } }
  | { type: 'RESOLVE_PULL'; results: DrawResult[]; cost: number }
  | { type: 'EXCHANGE'; itemId: string }
  | { type: 'CLAIM_MILESTONE'; id: string }
  | { type: 'CLEAR_DATA' };

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
  return {
    ...state,
    streakDays: streak,
    streakSevenRewarded: state.streakSevenRewarded || bonus,
    blindBox: { ...state.blindBox, stars: state.blindBox.stars + (bonus ? 5 : 0) },
  };
}

function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'OPEN_APP': {
      const { date } = action;
      if (state.dailyRewardDates.includes(date)) return state;
      const gap = state.lastOpenDate ? daysBetween(state.lastOpenDate, date) : 99;
      const mood = gap >= 2 ? '想你了' : '开心';
      const log = ensureLog(state, date);
      const base: AppState = {
        ...state,
        logs: log,
        lastOpenDate: date,
        dailyRewardDates: [...state.dailyRewardDates, date],
        avatar: addExp({ ...state.avatar, mood }, 5),
        blindBox: { ...state.blindBox, stars: state.blindBox.stars + 1 },
      };
      return applyStreak(base, date);
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
        blindBox: {
          ...state.blindBox,
          stars: state.blindBox.stars + 1 + (action.record.honestStar ? 1 : 0),
        },
      };
      return applyStreak(base, action.record.date);
    }
    case 'MARK_CHEAT': {
      const logs = ensureLog(state, action.date);
      const day = logs[action.date];
      if (day.isCheatDay) return state;
      const base: AppState = {
        ...state,
        logs: { ...logs, [action.date]: { ...day, isCheatDay: true, honestRewarded: true } },
        avatar: addExp({ ...state.avatar, mood: '满足地打嗝' }, 0),
        blindBox: { ...state.blindBox, stars: state.blindBox.stars + 1 },
      };
      return applyStreak(base, action.date);
    }
    case 'EXERCISE':
      return {
        ...state,
        totalExercise: state.totalExercise + 1,
        avatar: addExp({ ...state.avatar, mood: '活力满满' }, 20),
        blindBox: { ...state.blindBox, stars: state.blindBox.stars + 2 },
      };
    case 'CRAVING': {
      const logs = ensureLog(state, action.date);
      const day = logs[action.date];
      const resisted = action.result === 'resisted';
      return {
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
        blindBox: { ...state.blindBox, stars: state.blindBox.stars + 1 },
      };
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
    case 'ADD_PHOTO':
      return { ...state, photoTimeline: [action.photo, ...state.photoTimeline] };
    case 'RESOLVE_PULL': {
      const duplicates = action.results.filter((r) => r.isDuplicate).length;
      const newIds = action.results.filter((r) => !r.isDuplicate).map((r) => r.itemId);
      return {
        ...state,
        blindBox: {
          stars: Math.max(0, state.blindBox.stars - action.cost),
          fragments: state.blindBox.fragments + duplicates,
          ownedItems: Array.from(new Set([...state.blindBox.ownedItems, ...newIds])),
        },
        avatar: { ...state.avatar, mood: '拆礼物中' },
      };
    }
    case 'EXCHANGE': {
      if (state.blindBox.fragments < 10 || state.blindBox.ownedItems.includes(action.itemId)) return state;
      return {
        ...state,
        blindBox: {
          ...state.blindBox,
          fragments: state.blindBox.fragments - 10,
          ownedItems: [...state.blindBox.ownedItems, action.itemId],
        },
      };
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
      return {
        ...state,
        milestonesClaimed: [...state.milestonesClaimed, def.id],
        blindBox: {
          ...state.blindBox,
          ownedItems: Array.from(new Set([...state.blindBox.ownedItems, def.rewardItemId])),
        },
      };
    }
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
  remaining: number;
  limitedUnlocked: boolean;
  ownedItemNames: string[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reduce, undefined, loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    dispatch({ type: 'OPEN_APP', date: todayKey() });
  }, []);

  const value = useMemo<AppContextValue>(() => {
    const today = todayKey();
    const todayLog = state.logs[today] ?? emptyDayLog(today);
    const todayTotal = todayLog.records.reduce((sum, r) => sum + r.calories, 0);
    return {
      state,
      dispatch,
      todayLog,
      todayTotal,
      remaining: state.calorieGoal - todayTotal,
      limitedUnlocked: state.milestonesClaimed.length > 0,
      ownedItemNames: state.blindBox.ownedItems.map((id) => findItem(id)?.name ?? id),
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
