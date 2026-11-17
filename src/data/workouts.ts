import type { WorkoutDuration, WorkoutGoal } from '../types';
import { daysBetween } from '../utils/date';

export interface WorkoutPlan {
  id: string;
  name: string;
  duration: WorkoutDuration;
  goal: WorkoutGoal;
  /** 默认无器械；即使需要台阶也按「无需器械」处理 */
  equipment: string;
  /** 占位图用 emoji 表示，正式版可替换为 GIF URL */
  cover: string;
  image?: string;
  description: string;
  steps: string[];
}

export const goalLabels: Record<WorkoutGoal, string> = {
  fatLoss: '减脂',
  toning: '塑形',
  maintain: '保持',
};

export const durationLabels: Record<WorkoutDuration, string> = {
  5: '5 分钟',
  10: '10 分钟',
  20: '20 分钟',
};

export const workouts: WorkoutPlan[] = [
  {
    id: 'fl-5-1', name: '晨间原地踏步', duration: 5, goal: 'fatLoss', equipment: '无器械', cover: '🚶‍♀️',
    description: '像散步一样简单，先把身体叫醒。',
    steps: ['站直，手臂自然弯曲', '原地踏步 2 分钟，配合摆臂', '加快节奏踏步 2 分钟', '慢走 1 分钟，调整呼吸'],
  },
  {
    id: 'fl-5-2', name: '低冲击开合步', duration: 5, goal: 'fatLoss', equipment: '无器械', cover: '🤸',
    description: '不跳也能出汗，膝盖压力小一点。',
    steps: ['双脚与肩同宽站立', '左右交替点步，双臂上举再放下', '保持节奏 4 分钟', '最后 1 分钟慢慢收住'],
  },
  {
    id: 'fl-5-3', name: '厨房提踵操', duration: 5, goal: 'fatLoss', equipment: '无器械', cover: '🍳',
    description: '等水开的时候就能做完的小动作。',
    steps: ['扶住台面，双脚并拢', '踮起脚尖停 2 秒再落下', '重复 20 次', '换单脚提踵各 10 次'],
  },
  {
    id: 'fl-10-1', name: '客厅轻燃循环', duration: 10, goal: 'fatLoss', equipment: '无器械', cover: '🔥',
    description: '三个动作轮着来，客厅就是健身房。',
    steps: ['原地高抬腿 1 分钟', '徒手深蹲 15 次', '站姿提膝 1 分钟', '三个动作循环 3 轮，中间自由喘气'],
  },
  {
    id: 'fl-10-2', name: '楼梯轻快走', duration: 10, goal: 'fatLoss', equipment: '无器械', cover: '🪜',
    description: '上下几层楼，心率悄悄上来。',
    steps: ['上楼时保持匀速，不抢步', '下楼时脚尖先轻落', '来回走 8 分钟', '最后 2 分钟平地慢走'],
  },
  {
    id: 'fl-10-3', name: '站姿核心唤醒', duration: 10, goal: 'fatLoss', equipment: '无器械', cover: '🧘',
    description: '不躺下也能练到肚子。',
    steps: ['站直，双手轻扶腹部', '收紧腹部 5 秒再放松，重复 10 次', '左右侧屈各 10 次', '原地扭腰 1 分钟收尾'],
  },
  {
    id: 'fl-20-1', name: '无器械全身循环', duration: 20, goal: 'fatLoss', equipment: '无器械', cover: '💪',
    description: '一套从头到脚都照顾到的循环。',
    steps: ['开合步 2 分钟热身', '深蹲 20 次 + 俯身撑墙 15 次', '弓步交替 20 次 + 平板支撑 20 秒', '循环 3 轮，最后原地慢走 2 分钟'],
  },
  {
    id: 'fl-20-2', name: '饭后节奏走操', duration: 20, goal: 'fatLoss', equipment: '无器械', cover: '🌇',
    description: '不想剧烈运动时，就出门走一走。',
    steps: ['先慢走 3 分钟', '快走 5 分钟，手臂大幅摆动', '慢走 2 分钟穿插提踵 20 次', '剩余时间按舒服的速度走完'],
  },
  {
    id: 'tn-5-1', name: '肩颈舒展 5 分钟', duration: 5, goal: 'toning', equipment: '无器械', cover: '🙆',
    description: '久坐之后，给肩颈一点温柔。',
    steps: ['头部缓慢左右侧倾各 30 秒', '双肩向后绕圈 10 次', '双手十指交叉向上伸展 30 秒', '轻轻转动手腕收尾'],
  },
  {
    id: 'tn-5-2', name: '靠墙静蹲', duration: 5, goal: 'toning', equipment: '无器械', cover: '🧱',
    description: '找一面墙，安静练腿。',
    steps: ['背靠墙，双脚向前一步', '慢慢下滑到大腿与地面约 45 度', '保持 30 秒后站起', '重复 6 次，中间不勉强'],
  },
  {
    id: 'tn-5-3', name: '臀桥小练', duration: 5, goal: 'toning', equipment: '无器械', cover: '🍑',
    description: '躺着就能做的臀部唤醒。',
    steps: ['仰卧屈膝，双脚踩地', '臀部发力抬起身体，停 2 秒', '缓慢落下，重复 15 次', '最后做 30 秒仰卧抱膝放松'],
  },
  {
    id: 'tn-10-1', name: '核心稳定十练', duration: 10, goal: 'toning', equipment: '无器械', cover: '🎯',
    description: '一点点把腰腹练稳。',
    steps: ['平板支撑 20 秒 × 3 组', '仰卧死虫式左右各 10 次', '侧平板每侧 15 秒', '仰卧抬腿 10 次后拉伸腰部'],
  },
  {
    id: 'tn-10-2', name: '手臂线条轻训', duration: 10, goal: 'toning', equipment: '无器械', cover: '💅',
    description: '不用哑铃，也能练出手臂线条。',
    steps: ['双手对掌用力互推 10 次', '俯身撑墙做臂屈伸 15 次', '双臂画小圈各 20 次', '手臂上举拉伸 1 分钟'],
  },
  {
    id: 'tn-10-3', name: '侧腰拉伸塑形', duration: 10, goal: 'toning', equipment: '无器械', cover: '🌿',
    description: '侧腰舒展，呼吸也变顺了。',
    steps: ['站姿右手举过头顶向左侧屈', '保持 30 秒换边', '坐姿扭转每侧 30 秒', '重复 3 轮，动作放慢'],
  },
  {
    id: 'tn-20-1', name: '全身紧致循环', duration: 20, goal: 'toning', equipment: '无器械', cover: '✨',
    description: '给全身一个温柔又认真的安排。',
    steps: ['原地踏步 2 分钟热身', '深蹲 15 次 + 臀桥 15 次', '俯身撑墙 12 次 + 侧平板每侧 20 秒', '循环 3 轮，最后拉伸 2 分钟'],
  },
  {
    id: 'tn-20-2', name: '臀腿塑形套餐', duration: 20, goal: 'toning', equipment: '无器械', cover: '🍑',
    description: '专注臀腿，慢慢练出稳定感。',
    steps: ['徒手深蹲 20 次', '反向弓步左右各 12 次', '臀桥 20 次', '靠墙静蹲 30 秒 × 3 组，最后拉伸大腿'],
  },
  {
    id: 'mt-5-1', name: '呼吸舒展', duration: 5, goal: 'maintain', equipment: '无器械', cover: '🌬️',
    description: '今天只想动一动？从呼吸开始就好。',
    steps: ['坐姿或站姿，手放腹部', '鼻吸 4 秒，停 2 秒，口呼 6 秒', '重复 10 次', '轻轻转动肩膀结束'],
  },
  {
    id: 'mt-5-2', name: '肩背小伸展', duration: 5, goal: 'maintain', equipment: '无器械', cover: '🤸',
    description: '把背包和手机带来的紧绷松开。',
    steps: ['双臂向前平举，交叉抱住', '低头含胸保持 30 秒', '双臂向后打开扩胸 30 秒', '左右转肩各 10 次'],
  },
  {
    id: 'mt-5-3', name: '手腕脚踝唤醒', duration: 5, goal: 'maintain', equipment: '无器械', cover: '🌀',
    description: '小关节动起来，整个人都轻一点。',
    steps: ['手腕顺时针、逆时针各转 20 圈', '脚踝同样各转 20 圈', '十指开合 20 次', '原地轻轻踏步 1 分钟'],
  },
  {
    id: 'mt-10-1', name: '桌旁舒展 10 分钟', duration: 10, goal: 'maintain', equipment: '无器械', cover: '🪑',
    description: '工作间隙就能完成的一次小休息。',
    steps: ['站起来伸个懒腰 1 分钟', '肩颈绕圈 20 次', '站姿体前屈 30 秒 × 2', '原地踏步 3 分钟后坐下深呼吸'],
  },
  {
    id: 'mt-10-2', name: '太极步轻练', duration: 10, goal: 'maintain', equipment: '无器械', cover: '☯️',
    description: '慢一点，也能感受到身体在动。',
    steps: ['双脚一前一后，重心慢慢前后移动', '左右各 2 分钟', '双臂像推云一样缓慢划弧', '最后原地站立 1 分钟'],
  },
  {
    id: 'mt-10-3', name: '身体扫描放松', duration: 10, goal: 'maintain', equipment: '无器械', cover: '🌙',
    description: '从脚趾到头顶，和身体打个招呼。',
    steps: ['平躺或坐稳，闭眼', '注意力从脚依次移到腿、腹、肩、脸', '每个部位停留 30 秒', '结束后伸个大懒腰'],
  },
  {
    id: 'mt-20-1', name: '关节活动全流程', duration: 20, goal: 'maintain', equipment: '无器械', cover: '🫧',
    description: '把各个关节都照顾一遍。',
    steps: ['颈肩绕圈 2 分钟', '髋、膝、踝绕环各 2 分钟', '站姿体前屈与侧屈各 2 分钟', '原地踏步与拉伸共 8 分钟'],
  },
  {
    id: 'mt-20-2', name: '睡前舒缓流动', duration: 20, goal: 'maintain', equipment: '无器械', cover: '😴',
    description: '不追求出汗，只求睡得香一点。',
    steps: ['仰卧抱膝 2 分钟', '轻柔扭腰每侧 2 分钟', '靠墙倒箭式 5 分钟', '全身舒展深呼吸 9 分钟'],
  },
];

export function getWorkoutById(id: string): WorkoutPlan | undefined {
  return workouts.find((w) => w.id === id);
}

export function getWorkoutCandidates(
  goal: WorkoutGoal,
  duration: WorkoutDuration,
  recentIds: string[] = [],
  lowBarrier = false,
): WorkoutPlan[] {
  let pool = workouts.filter((w) => w.goal === goal && w.duration === duration);
  if (lowBarrier) {
    const easy = pool.filter((w) => w.duration === 5);
    pool = easy.length > 0 ? easy : workouts.filter((w) => w.duration === 5);
  }
  if (pool.length === 0) pool = workouts.filter((w) => w.duration === duration);
  if (pool.length === 0) pool = workouts;
  const fresh = pool.filter((w) => !recentIds.includes(w.id));
  return fresh.length > 0 ? fresh : pool;
}

export function pickWorkout(
  goal: WorkoutGoal,
  duration: WorkoutDuration,
  recentIds: string[],
  date: string,
  lowBarrier = false,
): WorkoutPlan {
  const candidates = getWorkoutCandidates(goal, duration, recentIds, lowBarrier);
  const index = Math.abs(daysBetween('1970-01-01', date)) % candidates.length;
  return candidates[index];
}
