export type Personality = 'gentle' | 'sassy' | 'funny';
export type BlindBoxPool = 'normal' | 'limited';
export type BlindBoxItemType =
  | 'outfit'
  | 'hair'
  | 'accessory'
  | 'background'
  | 'action'
  | 'bottom'
  | 'shoes'
  | 'look';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'late' | 'unknown';

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
  bottom?: string;
  shoes?: string;
}

export interface FoodRecord {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  source: 'photo' | 'manual' | 'eat';
  mealType?: MealType;
  time?: string;
  amount?: number;
  grams?: number;
  sourceLabel?: string;
  feedback?: string;
  honestStar?: boolean;
}

export interface WaterLog {
  id: string;
  date: string;
  time: string;
  amount: number;
  cupId: string;
}

export interface ActivityLog {
  id: string;
  date: string;
  time: string;
  name: string;
  calories: number;
  steps?: number;
}

export interface WaterCup {
  id: string;
  label: string;
  color: string;
  icon: string;
  capacity: number;
  custom?: boolean;
}

export interface StarEntry {
  id: string;
  date: string;
  amount: number;
  reason: string;
}

export interface FavoriteLook {
  id: string;
  name: string;
  config: AvatarConfig;
}

export interface ReminderSettings {
  water: boolean;
  meals: boolean;
  cheer: boolean;
}

export interface ReminderTimes {
  morning: string;
  noon: string;
  evening: string;
}

export interface MoodLog {
  mood: string;
  note?: string;
}

export interface TasteProfile {
  /** 旧版单选口味，迁移时保留 */
  flavor: string;
  /** 多选口味（清淡、咸鲜……异国风味） */
  flavors: string[];
  /** 饮食禁忌：过敏/宗教/医嘱 */
  dietaryTaboos: string[];
  /** 饮食禁忌对应的填写内容，键为禁忌名 */
  dietaryTabooNotes: Record<string, string>;
  /** 忌口条目（来自常见忌口各分组，可多选） */
  avoid: string[];
  /** 饮食目标选项 id，兼容旧版直接存文案 */
  goal: string;
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

export interface Friend {
  id: string;
  code: string;
  name: string;
  stars?: number;
  streak?: number;
  hearts?: number;
  note?: string;
}

export type FriendPrivacy = 'open' | 'friends' | 'private';

export interface AppState {
  avatar: AvatarState;
  blindBox: BlindBoxState;
  logs: Record<string, DayLog>;
  skippedMealsByDate: Record<string, string[]>;
  calorieGoal: number;
  /** 基础代谢，默认 1300 kcal，可在「我的」页修改；0 表示数据不足 */
  bmr: number;
  height: number;
  weightRecords: Record<string, number>;
  /** 旧版按杯数存储，仅用于迁移和兼容 */
  waterByDate: Record<string, number>;
  waterLogs: WaterLog[];
  activityLogs: ActivityLog[];
  waterCup: WaterCup;
  waterGoal: number;
  stepsByDate: Record<string, number>;
  activityStarDates: string[];
  healthConnected: boolean;
  starLedger: StarEntry[];
  dailyEarnedByDate: Record<string, number>;
  dailyCheerDates: string[];
  waterStarDates: string[];
  walkStarDates: string[];
  moodStarDates: string[];
  moodLogs: Record<string, MoodLog>;
  tasteProfile: TasteProfile;
  activeCaloriesByDate: Record<string, number>;
  unseenItems: string[];
  lastBoxResult: DrawResult[] | null;
  lastBoxNewItemId?: string;
  favoriteLooks: FavoriteLook[];
  reminders: ReminderSettings;
  reminderTimes: ReminderTimes;
  guideSeen: boolean;
  photoTimeline: { date: string; imageDataUrl: string }[];
  streakDays: number;
  streakSevenRewarded: boolean;
  lastOpenDate: string;
  milestonesClaimed: string[];
  dailyRewardDates: string[];
  totalMealsLogged: number;
  totalCravingsResisted: number;
  /** 好友与仓鼠装饰（新增字段，旧数据会自动补默认值） */
  friends: Friend[];
  friendPrivacy: FriendPrivacy;
  friendTheme: string;
  hamsterDecorOwned: string[];
  hamsterDecorEquipped: string;
  /** 预计消耗所需资料，缺失时不展示估算 */
  age?: number;
  activityLevel?: string;
  appearanceVersion?: number;
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
