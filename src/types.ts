export type Personality = 'gentle' | 'sassy' | 'funny';
export type BlindBoxPool = 'normal' | 'limited';
export type BlindBoxItemType = 'outfit' | 'hair' | 'accessory' | 'background' | 'action';

export interface AvatarConfig {
  face: string;
  hair: string;
  skin: string;
  outfit: string;
  accessory: string;
  name: string;
  personality: Personality;
  background?: string;
  action?: string;
}

export interface FoodRecord {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  source: 'photo' | 'manual';
  feedback?: string;
  honestStar?: boolean;
}

export interface DayLog {
  date: string;
  records: FoodRecord[];
  isCheatDay: boolean;
  cravingResisted: number;
  honestRewarded?: boolean;
}

export interface AvatarState {
  level: number;
  exp: number;
  mood: string;
  equipped: AvatarConfig;
}

export interface BlindBoxState {
  stars: number;
  fragments: number;
  ownedItems: string[];
}

export interface AppState {
  avatar: AvatarState;
  blindBox: BlindBoxState;
  logs: Record<string, DayLog>;
  calorieGoal: number;
  photoTimeline: { date: string; imageDataUrl: string }[];
  streakDays: number;
  streakSevenRewarded: boolean;
  lastOpenDate: string;
  milestonesClaimed: string[];
  /** 以下为原型需要补充的统计字段 */
  dailyRewardDates: string[];
  totalMealsLogged: number;
  totalCravingsResisted: number;
  totalExercise: number;
}

export interface RecognitionResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  feedback: string;
}

export interface DrawResult {
  itemId: string;
  isDuplicate: boolean;
}
