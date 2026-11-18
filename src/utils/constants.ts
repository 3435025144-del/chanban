import type { AppState, DayLog } from '../types';

export const STORAGE_KEY = 'chanban-app-state-v1';

export const DEFAULT_EQUIPPED = {
  face: 'round',
  hair: 'bob',
  skin: 'warm',
  outfit: 'teeCoral',
  accessory: 'none',
  name: '小馋',
  personality: 'gentle' as const,
  background: 'sunny',
  action: 'none',
};

export function emptyDayLog(date: string): DayLog {
  return { date, records: [], isCheatDay: false, cravingResisted: 0 };
}

export function initialState(): AppState {
  return {
    avatar: {
      level: 1,
      exp: 0,
      mood: '开心',
      equipped: { ...DEFAULT_EQUIPPED },
    },
    blindBox: { stars: 3, fragments: 0, ownedItems: [] },
    logs: {},
    calorieGoal: 1500,
    height: 165,
    weightRecords: {},
    waterByDate: {},
    photoTimeline: [],
    streakDays: 0,
    streakSevenRewarded: false,
    lastOpenDate: '',
    milestonesClaimed: [],
    dailyRewardDates: [],
    totalMealsLogged: 0,
    totalCravingsResisted: 0,
  };
}

export function expToNext(level: number): number {
  return 100 + (level - 1) * 50;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const base = initialState();
    return {
      ...base,
      ...parsed,
      avatar: { ...base.avatar, ...parsed.avatar, equipped: { ...base.avatar.equipped, ...parsed.avatar?.equipped } },
      blindBox: { ...base.blindBox, ...parsed.blindBox },
      logs: parsed.logs ?? {},
      photoTimeline: parsed.photoTimeline ?? [],
      milestonesClaimed: parsed.milestonesClaimed ?? [],
      dailyRewardDates: parsed.dailyRewardDates ?? [],
      streakSevenRewarded: parsed.streakSevenRewarded ?? false,
      height: parsed.height ?? base.height,
      weightRecords: parsed.weightRecords ?? {},
      waterByDate: parsed.waterByDate ?? {},
    };
  } catch {
    return initialState();
  }
}
