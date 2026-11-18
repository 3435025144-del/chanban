import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { getLowBarrierLine, getWorkoutLine } from '../data/avatarLines';
import { findItem, milestones } from '../data/blindBoxItems';
import { getWorkoutById, pickWorkout, type WorkoutPlan } from '../data/workouts';
import type {
  AppState,
  AvatarConfig,
  AvatarState,
  DayLog,
  DrawResult,
  FoodRecord,
  WorkoutDuration,
  WorkoutGoal,
} from '../types';
import { daysBetween, shiftDate, todayKey } from '../utils/date';
import { emptyDayLog, expToNext, initialState, loadState, STORAGE_KEY } from '../utils/constants';

type Action =
  | { type: 'OPEN_APP'; date: string }
  | { type: 'ADD_RECORD'; record: FoodRecord }
  | { type: 'MARK_CHEAT'; date: string }
  | { type: 'EXERCISE' }
  | { type: 'SET_COACH_CONFIG'; goal: WorkoutGoal; duration: WorkoutDuration; date: string }
  | { type: 'WORKOUT_COMPLETE'; date: string }
  | { type: 'WORKOUT_SKIP'; date: string }
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

function missedWorkoutDays(state: AppState, date: string): number {
  const status = state.coach.dailyStatus;
  const keys = Object.keys(status).sort();
  const earliest = keys[0] ?? state.coach.lastCompletedDate;
  if (!earliest) return 0;
  let cursor = shiftDate(date, -1);
  let count = 0;
  while (cursor >= earliest && status[cursor] !== 'completed' && count < 60) {
    count += 1;
    cursor = shiftDate(cursor, -1);
  }
  return count;
}

function withCoachPlan(state: AppState, date: string): AppState {
  const coach = state.coach;
  if (!coach.onboarded) return state;
  const lowBarrier = missedWorkoutDays(state, date) >= 3;
  const existing = coach.recommendations.find((r) => r.date === date);
  if (existing && (!lowBarrier || getWorkoutById(existing.planId)?.duration === 5)) return state;

  const recentIds = coach.recommendations
    .filter((r) => r.date >= shiftDate(date, -2))
    .map((r) => r.planId);
  const plan: WorkoutPlan = pickWorkout(coach.goal, coach.duration, recentIds, date, lowBarrier);
  const recommendations = [
    ...coach.recommendations.filter((r) => r.date !== date),
    { date, planId: plan.id },
  ].slice(-30);
  return { ...state, coach: { ...coach, recommendations } };
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
      return withCoachPlan(applyStreak(base, date), date);
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
    case 'SET_COACH_CONFIG': {
      const coach = {
        ...state.coach,
        onboarded: true,
        goal: action.goal,
        duration: action.duration,
        recommendations: state.coach.recommendations.filter((r) => r.date !== action.date),
      };
      return withCoachPlan({ ...state, coach }, action.date);
    }
    case 'WORKOUT_COMPLETE': {
      const coach = {
        ...state.coach,
        dailyStatus: { ...state.coach.dailyStatus, [action.date]: 'completed' as const },
        lastCompletedDate: action.date,
      };
      const base: AppState = {
        ...state,
        coach,
        totalExercise: state.totalExercise + 1,
        avatar: addExp({ ...state.avatar, mood: '活力满满' }, 20),
        blindBox: { ...state.blindBox, stars: state.blindBox.stars + 2 },
      };
      return applyStreak(base, action.date);
    }
    case 'WORKOUT_SKIP': {
      const coach = {
        ...state.coach,
        dailyStatus: { ...state.coach.dailyStatus, [action.date]: 'skipped' as const },
      };
      return { ...state, coach, avatar: { ...state.avatar, mood: '陪你一起' } };
    }
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
  todayWorkout: WorkoutPlan | null;
  workoutLowBarrier: boolean;
  workoutLine: string;
  lowBarrierLine: string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reduce, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 以 file:// 打开时部分浏览器会禁用 localStorage，忽略即可
    }
  }, [state]);

  useEffect(() => {
    dispatch({ type: 'OPEN_APP', date: todayKey() });
  }, []);

  const value = useMemo<AppContextValue>(() => {
    const today = todayKey();
    const todayLog = state.logs[today] ?? emptyDayLog(today);
    const todayTotal = todayLog.records.reduce((sum, r) => sum + r.calories, 0);
    const recommendedId = state.coach.recommendations.find((r) => r.date === today)?.planId;
    const todayWorkout = recommendedId ? getWorkoutById(recommendedId) ?? null : null;
    const workoutLowBarrier = !!todayWorkout && todayWorkout.duration === 5 && missedWorkoutDays(state, today) >= 3;
    return {
      state,
      dispatch,
      todayLog,
      todayTotal,
      remaining: state.calorieGoal - todayTotal,
      limitedUnlocked: state.milestonesClaimed.length > 0,
      ownedItemNames: state.blindBox.ownedItems.map((id) => findItem(id)?.name ?? id),
      todayWorkout,
      workoutLowBarrier,
      workoutLine: getWorkoutLine(state.avatar.equipped.personality),
      lowBarrierLine: getLowBarrierLine(),
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
