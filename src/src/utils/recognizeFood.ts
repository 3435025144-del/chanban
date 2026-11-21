import type { RecognitionResult } from '../types';

const PRESET: RecognitionResult[] = [
  { name: '鸡胸肉藜麦沙拉', calories: 365, protein: 32, carbs: 34, fat: 10, feedback: '这一餐搭配得很清爽，分身开心地晃了晃小脚。' },
  { name: '番茄鸡蛋盖饭（少油）', calories: 480, protein: 22, carbs: 66, fat: 13, feedback: '熟悉的家常味，记录下来的你超棒！' },
  { name: '牛肉荞麦面', calories: 520, protein: 30, carbs: 68, fat: 14, feedback: '热乎乎的一碗，分身也闻着香呢。' },
  { name: '香煎三文鱼配西兰花', calories: 430, protein: 34, carbs: 12, fat: 28, feedback: '优质脂肪也要好好享受，记下来就很好。' },
  { name: '奶油蛋糕一块（放纵餐）', calories: 560, protein: 6, carbs: 62, fat: 32, feedback: '甜甜的快乐被认真记下了，分身满足地打了个小嗝～' },
  { name: '炸鸡两份 + 可乐', calories: 980, protein: 42, carbs: 96, fat: 48, feedback: '快乐是真的，诚实记录也是真的，今天额外送你一颗诚实星！' },
  { name: '豆腐菌菇汤 + 糙米饭', calories: 390, protein: 20, carbs: 58, fat: 8, feedback: '暖胃又舒服，分身给你比了个大拇指。' },
  { name: '虾仁牛油果吐司', calories: 455, protein: 26, carbs: 40, fat: 22, feedback: '绿色系的一餐，看起来很有精神！' },
];

/**
 * 模拟识别接口。
 * 正式版接入位置：将下方实现替换为 `fetch('/api/recognize', { method:'POST', body: formData })`，
 * 保持返回 RecognitionResult 结构即可，页面层无需改动。
 */
export async function recognizeFood(_imageDataUrl: string): Promise<RecognitionResult> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  return PRESET[Math.floor(Math.random() * PRESET.length)];
}

export function isLikelyCheat(result: RecognitionResult): boolean {
  return result.calories >= 600;
}
