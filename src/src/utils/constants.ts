import { cupPresets } from '../data/cups';
import type { AppState, DayLog, WaterLog } from '../types';

export const STORAGE_KEY = 'chanban-app-state-v1';

export const DEFAULT_EQUIPPED = {
  face: 'round',
  hair: 'bob',
  skin: 'warm',
  outfit: 'hoodie',
  bottom: 'shortsMix',
  shoes: 'sneaker',
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
    waterLogs: [],
    waterCup: { ...cupPresets[0] },
    waterGoal: 1600,
    stepsByDate: {},
    healthConnected: false,
    starLedger: [],
    dailyEarnedByDate: {},
    dailyCheerDates: [],
    waterStarDates: [],
    walkStarDates: [],
    moodStarDates: [],
    moodLogs: {},
    tasteProfile: { flavor: '清淡', avoid: ['不吃香菜', '少辣'], goal: '保持体重 · 晚餐清淡' },
    activeCaloriesByDate: {},
    unseenItems: [],
    lastBoxResult: null,
    favoriteLooks: [],
    reminders: { water: true, meals: true, cheer: false },
    reminderTimes: { morning: '08:00', noon: '12:00', evening: '20:00' },
    guideSeen: false,
    photoTimeline: [],
    streakDays: 0,
    streakSevenRewarded: false,
    lastOpenDate: '',
    milestonesClaimed: [],
    dailyRewardDates: [],
    totalMealsLogged: 0,
    totalCravingsResisted: 0,
    appearanceVersion: 2,
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
    const version = parsed.appearanceVersion ?? 1;
    const equipped = { ...base.avatar.equipped, ...parsed.avatar?.equipped };
    if (version < 2) {
      equipped.hair = 'bob';
      equipped.outfit = 'hoodie';
    }

    let waterLogs = parsed.waterLogs ?? [];
    if (waterLogs.length === 0 && parsed.waterByDate && Object.keys(parsed.waterByDate).length > 0) {
      const migrated: WaterLog[] = [];
      Object.entries(parsed.waterByDate).forEach(([date, count]) => {
        for (let i = 0; i < count; i += 1) {
          migrated.push({ id: `migrate-${date}-${i}`, date, time: '09:00', amount: 200, cupId: 'mini' });
        }
      });
      waterLogs = migrated;
    }

    return {
      ...base,
      ...parsed,
      avatar: { ...base.avatar, ...parsed.avatar, equipped },
      blindBox: { ...base.blindBox, ...parsed.blindBox },
      logs: parsed.logs ?? {},
      photoTimeline: parsed.photoTimeline ?? [],
      milestonesClaimed: parsed.milestonesClaimed ?? [],
      dailyRewardDates: parsed.dailyRewardDates ?? [],
      streakSevenRewarded: parsed.streakSevenRewarded ?? false,
      height: parsed.height ?? base.height,
      weightRecords: parsed.weightRecords ?? {},
      waterByDate: parsed.waterByDate ?? {},
      waterLogs,
      waterCup: parsed.waterCup ?? base.waterCup,
      waterGoal: parsed.waterGoal ?? base.waterGoal,
      stepsByDate: parsed.stepsByDate ?? {},
      healthConnected: parsed.healthConnected ?? false,
      starLedger: parsed.starLedger ?? [],
      dailyEarnedByDate: parsed.dailyEarnedByDate ?? {},
      dailyCheerDates: parsed.dailyCheerDates ?? [],
      waterStarDates: parsed.waterStarDates ?? [],
      walkStarDates: parsed.walkStarDates ?? [],
      moodStarDates: parsed.moodStarDates ?? [],
      moodLogs: parsed.moodLogs ?? {},
      tasteProfile: { ...base.tasteProfile, ...parsed.tasteProfile },
      activeCaloriesByDate: parsed.activeCaloriesByDate ?? {},
      unseenItems: parsed.unseenItems ?? [],
      lastBoxResult: parsed.lastBoxResult ?? null,
      lastBoxNewItemId: parsed.lastBoxNewItemId,
      favoriteLooks: parsed.favoriteLooks ?? [],
      reminders: { ...base.reminders, ...parsed.reminders },
      reminderTimes: { ...base.reminderTimes, ...parsed.reminderTimes },
      guideSeen: parsed.guideSeen ?? false,
      appearanceVersion: 2,
    };
  } catch {
    return initialState();
  }
}
