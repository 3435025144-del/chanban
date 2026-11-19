import type { Personality } from '../types';

export const gentleLines: string[] = [
  '你今天有好好吃饭吗？有的话就太好了，我陪着你呢。',
  '慢慢来，好吃的东西和好心情都值得被认真对待。',
  '我记得你上次记录的样子，那时候你笑得特别好看。',
  '嘴馋不是坏事情呀，它在提醒你生活还挺有味道的。',
  '今天想吃什么就告诉我，我们一起把它记下来。',
  '你已经很努力了，现在可以先把肩膀放松一下。',
  '一份食物只是一份食物，你可比它有趣多啦。',
  '就算今天吃得热闹一点，明天也还是崭新的一天。',
  '我在这里，不问你吃了什么，只想陪你聊聊天。',
  '喝口水，深呼吸，我们按自己的节奏来。',
];

export const sassyLines: string[] = [
  '哟，来了？我正想说今天没人陪我聊天呢。',
  '吃就吃了呗，记下来这么萌的行为谁不爱看。',
  '别一脸心虚，你又不是偷了全世界的蛋糕。',
  '我今天的状态是：等你来给我讲讲好吃的。',
  '管它热量多少，诚实的人类最迷人，懂？',
  '你那点小嘴馋，还不够我塞牙缝的，记录走起。',
  '别犹豫啦，点一下拍照，今天的故事就算开了头。',
  '谁规定减肥就得苦着脸？我第一个不同意。',
  '放纵餐怎么了，那是你和生活和解的证据。',
  '好了好了，别盯着我，去把今天的快乐记下来。',
];

export const funnyLines: string[] = [
  '噔噔！我是你的分身，专门负责替你开心。',
  '我刚刚偷偷练了一个饱嗝，现在表演给你看：嗝～',
  '据可靠消息，你今天的味蕾正在申请加薪。',
  '如果开心有单位，你今天早就满格的那种！',
  '我决定宣布：今天是与蔬菜和平共处纪念日。',
  '馋了？来，我们先对着屏幕做三秒气球人。',
  '我的肚子是道具，你的肚子是主角，别搞混了。',
  '报告！检测到一名人类正在犹豫要不要记录，请求鼓励。',
  '放心，我这个分身只负责鼓掌，不负责记账本。',
  '你要是吃了蛋糕，我就假装那也是我的那份。',
];

export const cheatLines: string[] = [
  '嗝～这份满足我收到了，快乐也收到了。',
  '好吃到打了个小嗝，明天我们照常见面。',
  '嗯……这一餐很幸福，我决定把它记进小本本。',
  '吃饱了就想睡觉，分身眯一会儿，你慢慢来。',
];

export const missingLines: string[] = [
  '想你了，刚刚还在数你几天没来找我呢。',
  '你不在的时候，我把阳光数了一遍又一遍。',
  '回来啦？我这里一直留着你的位置。',
  '没关系，我们重新从一句你好开始。',
];

export const greetingLines: string[] = [
  '早上好呀，今天也要开开心心地吃饭。',
  '下午好，来一口快乐补充剂怎么样？',
  '晚上好，今天辛苦啦，先坐下来歇歇。',
  '嗨，我在等你分享今天的第一口好味道。',
];

const pool: Record<Personality, string[]> = {
  gentle: gentleLines,
  sassy: sassyLines,
  funny: funnyLines,
};

export function getAvatarLine(personality: Personality, context?: 'cheat' | 'missing'): string {
  const list = context === 'cheat' ? cheatLines : context === 'missing' ? missingLines : pool[personality];
  return list[Math.floor(Math.random() * list.length)];
}

export function getAllLines(personality: Personality): string[] {
  return pool[personality];
}

interface HomeLineContext {
  hour: number;
  meals: number;
  waterMl: number;
  stars: number;
  cheat: boolean;
}

const firstMealLines: Record<Personality, string[]> = {
  gentle: ['第一餐想从哪里开始？我在旁边陪你。', '慢慢挑，今天的第一口值得被好好对待。'],
  sassy: ['第一餐还没影儿呢，我可没催你啊。', '来吧，给今天开个头，我负责鼓掌。'],
  funny: ['报告：今天的第一餐正在等待勇者出现。', '我宣布，第一餐仪式现在开始！'],
};
const recordedLines: Record<Personality, string[]> = {
  gentle: ['已经记下一些啦，我们继续按舒服的节奏来。', '看到你的记录，我觉得今天也挺温柔的。'],
  sassy: ['记得不错嘛，继续保持这种不较劲的劲儿。', '都记下来了，看来今天过得挺有滋味。'],
  funny: ['记录进度正在加载，我这边负责撒花。', '好看，今天的我因为被记录而发光。'],
};
const waterLines: Record<Personality, string[]> = {
  gentle: ['要先陪我喝一口水吗？不急，慢慢来。', '水杯就在旁边，想喝的时候再喝。'],
  sassy: ['水杯在看你哦，它说想被用一下。', '喝口水，别让小水杯太孤单。'],
  funny: ['水杯发明了一个新技能：等你看它。', '我刚才和水杯商量好了，它负责等，你负责随意。'],
};
const starLines: Record<Personality, string[]> = {
  gentle: ['今天已经有小星星落进口袋啦，谢谢你记得我。', '每一颗星都是你好好照顾自己的证据。'],
  sassy: ['口袋里有星了哦，别假装没看见。', '不错嘛，星星都愿意往你这边跑。'],
  funny: ['叮！今日星星已到账，我的口袋负责发光。', '星星到账提示音：叮叮叮，开心加倍。'],
};

export function getContextLine(personality: Personality, ctx: HomeLineContext): string {
  const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
  if (ctx.cheat) return pick(cheatLines);
  if (ctx.meals === 0) return pick(firstMealLines[personality]);
  if (ctx.waterMl === 0) return pick(waterLines[personality]);
  if (ctx.stars > 0) return pick(starLines[personality]);
  return pick(recordedLines[personality]);
}

export function getGreetingByHour(hour: number): string {
  if (hour < 11) return greetingLines[0];
  if (hour < 17) return greetingLines[1];
  return greetingLines[2];
}
