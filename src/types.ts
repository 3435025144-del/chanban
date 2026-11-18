export type Personality = 'gentle' | 'sassy' | 'funny';
export type BlindBoxPool = 'normal' | 'limited';
export type BlindBoxItemType = 'outfit' | 'hair' | 'accessory' | 'background' | 'action';
export type MealType = 'breakfast' | 'lunch' | 'dinner';

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
  mealType?: MealType;
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
  height: number;
  weightRecords: Record<string, number>;
  waterByDate: Record<string, number>;
  photoTimeline: { date: string; imageDataUrl: string }[];
  streakDays: number;
  streakSevenRewarded: boolean;
  lastOpenDate: string;
  milestonesClaimed: string[];
  dailyRewardDates: string[];
  totalMealsLogged: number;
  totalCravingsResisted: number;
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
