export interface FaceOption { id: string; label: string; rx: number; ry: number }
export interface HairOption { id: string; label: string; color: string }
export interface SkinOption { id: string; label: string; color: string }
export interface OutfitOption { id: string; label: string; color: string; accent: string }
export interface AccessoryOption { id: string; label: string }
export interface SceneOption { id: string; label: string; from: string; to: string }
export interface ActionOption { id: string; label: string }

export const faceOptions: FaceOption[] = [
  { id: 'round', label: '圆圆的', rx: 47, ry: 49 },
  { id: 'oval', label: '鹅蛋脸', rx: 43, ry: 52 },
  { id: 'square', label: '方方的', rx: 46, ry: 46 },
  { id: 'heart', label: '小V脸', rx: 45, ry: 51 },
  { id: 'long', label: '长脸蛋', rx: 40, ry: 55 },
];

export const hairOptions: HairOption[] = [
  { id: 'bob', label: '波波头', color: '#F2A0A8' },
  { id: 'ponytail', label: '马尾', color: '#5C4033' },
  { id: 'short', label: '短发', color: '#3E312C' },
  { id: 'bun', label: '丸子头', color: '#564037' },
  { id: 'wavy', label: '小卷发', color: '#E992A4' },
  { id: 'none', label: '光头', color: 'transparent' },
];

export const skinOptions: SkinOption[] = [
  { id: 'ivory', label: '奶油白', color: '#FFE4D2' },
  { id: 'warm', label: '暖蜜色', color: '#F8C9A8' },
  { id: 'honey', label: '蜂蜜色', color: '#E9AE82' },
  { id: 'tan', label: '小麦色', color: '#CF8E63' },
  { id: 'rose', label: '粉粉的', color: '#FFD6C6' },
];

export const outfitOptions: OutfitOption[] = [
  { id: 'teeCoral', label: '橘子汽水T', color: '#FF8B72', accent: '#FFE0D5' },
  { id: 'hoodie', label: '慵懒连帽衫', color: '#F6D36B', accent: '#FFF0A8' },
  { id: 'sports', label: '元气运动服', color: '#7FA8E8', accent: '#E3EDFF' },
  { id: 'dress', label: '草莓小裙子', color: '#F49AB0', accent: '#FFE3EA' },
  { id: 'stripe', label: '海盐条纹衫', color: '#F4F0E6', accent: '#6FA9C9' },
  { id: 'coat', label: '焦糖小外套', color: '#C98F5E', accent: '#F7E6D4' },
];

export const accessoryOptions: AccessoryOption[] = [
  { id: 'none', label: '不戴' },
  { id: 'glasses', label: '圆框眼镜' },
  { id: 'bow', label: '蝴蝶结' },
  { id: 'hat', label: '小黄帽' },
  { id: 'hairpin', label: '发夹' },
  { id: 'earrings', label: '小耳环' },
];

export const backgroundOptions: SceneOption[] = [
  { id: 'sunny', label: '晴天', from: '#FFF1DC', to: '#FFD9C2' },
  { id: 'mint', label: '薄荷', from: '#E7F9F2', to: '#C4EEE0' },
  { id: 'sunset', label: '晚霞', from: '#FFE0E6', to: '#FFC3A8' },
  { id: 'night', label: '星空', from: '#DDE4FF', to: '#B9C6F5' },
  { id: 'cloud', label: '云端', from: '#EDF6FF', to: '#D6E9FF' },
];

export const actionOptions: ActionOption[] = [
  { id: 'none', label: '自然' },
  { id: 'sparkle', label: '闪闪发光' },
  { id: 'blush', label: '害羞' },
  { id: 'sleepy', label: '打个小嗝' },
  { id: 'wave', label: '挥挥手' },
];
