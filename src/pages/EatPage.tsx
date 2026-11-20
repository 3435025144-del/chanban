import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import Hamster from '../components/Hamster';
import Icon from '../components/Icon';
import SubPageHeader from '../components/SubPageHeader';
import { useApp } from '../context/AppContext';
import { ingredients } from '../data/ingredients';
import { recipes, type Recipe } from '../data/recipes';
import { recommendations } from '../data/recommendations';
import {
  foodById, foods, merchantOffers, offersFor, recipeFood, recipeForFood, similarFoods,
  type FoodItem, type MerchantOffer,
} from '../data/foodCatalog';
import { getMealByTime, currentTime, mealLabels } from '../utils/meal';
import type { MealType } from '../types';
import { todayKey } from '../utils/date';

type Mode = 'recommend' | 'find';
type FindWay = 'delivery' | 'recipe' | 'nearby';
type Source = 'recommendation' | FindWay;
type Method = 'delivery' | 'cook' | 'nearby';
type SortBy = 'calories' | 'minutes';

const conditions = ['有点饿', '想吃热的', '30 元以内', '清淡偏好'];
const deliveryCategories = ['全部', '早餐', '快餐', '咖啡', '火锅', '简餐'];
const deliveryFilters = ['30 元内', '20 分钟内', '距离 1km 内', '清淡'];
const nearbyFilters = ['是否营业', '步行 10 分钟', '人均 30 元内', '当前菜品匹配状态'];

const findWayMeta: { id: FindWay; label: string; tint: string; icon: 'eat' | 'sparkle' | 'pin' }[] = [
  { id: 'delivery', label: '找外卖', tint: 'bg-greenSoft', icon: 'eat' },
  { id: 'recipe', label: '找菜谱', tint: 'bg-peachSoft', icon: 'sparkle' },
  { id: 'nearby', label: '找附近', tint: 'bg-cyanSoft', icon: 'pin' },
];

const methodMeta: { id: Method; label: string; tint: string; icon: 'eat' | 'sparkle' | 'pin' }[] = [
  { id: 'delivery', label: '点外卖', tint: 'bg-greenSoft', icon: 'eat' },
  { id: 'cook', label: '自己做', tint: 'bg-peachSoft', icon: 'sparkle' },
  { id: 'nearby', label: '附近商家', tint: 'bg-cyanSoft', icon: 'pin' },
];

const ingredientAmount: Record<string, string> = {
  chicken: '150g', egg: '2 个', shrimp: '120g', tofu: '200g', beef: '120g', salmon: '150g',
  broccoli: '100g', tomato: '2 个', mushroom: '80g', spinach: '100g', quinoa: '80g 干重', brownRice: '1 碗',
};

function ingredientName(id: string): string {
  return ingredients.find((item) => item.id === id)?.name ?? id;
}
function minutesFor(recipe: Recipe): number {
  return recipe.steps.length * 5 + 5;
}
function distanceMeters(distance: string): number {
  const m = distance.match(/([\d.]+)\s*(km|m)/i);
  if (!m) return 9999;
  return m[2].toLowerCase() === 'km' ? parseFloat(m[1]) * 1000 : parseFloat(m[1]);
}
function conditionsMatch(food: FoodItem, active: string[]): boolean {
  if (active.includes('有点饿') && food.calories < 400) return false;
  if (active.includes('想吃热的') && !/饭|面|汤|煲|蒸|炖|暖/.test(food.name + food.desc)) return false;
  if (active.includes('30 元以内') && food.price > 30) return false;
  if (active.includes('清淡偏好') && !/清淡|清爽|不油|暖|汤|蒸|沙拉|嫩|轻/.test(food.name + food.desc + food.tag)) return false;
  return true;
}

export default function EatPage() {
  const { state, dispatch, todayTotal, notify } = useApp();

  const [mode, setMode] = useState<Mode>('recommend');
  const [findWay, setFindWay] = useState<FindWay | null>('delivery');
  const [meal, setMeal] = useState<MealType>(() => getMealByTime());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [sortBy, setSortBy] = useState<SortBy>('calories');
  const [activeConditions, setActiveConditions] = useState<string[]>([]);
  const [onlyCanCook, setOnlyCanCook] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [deliveryActive, setDeliveryActive] = useState<string[]>([]);
  const [nearbyActive, setNearbyActive] = useState<string[]>([]);
  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const [recIndex, setRecIndex] = useState(0);
  const [rejects, setRejects] = useState(0);

  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [selectedIngredientsForRecipe, setSelectedIngredientsForRecipe] = useState<string[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantOffer | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [stepMode, setStepMode] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expandedSearch, setExpandedSearch] = useState(false);
  const [portion, setPortion] = useState('1');
  const [time, setTime] = useState(() => currentTime());

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const sheetCloseRef = useRef<HTMLButtonElement | null>(null);
  const confirmCloseRef = useRef<HTMLButtonElement | null>(null);

  const recommendFoods = useMemo(() => {
    const list = foods.filter((f) => recommendations.some((r) => `food-${r.id}` === f.id) && conditionsMatch(f, activeConditions));
    return list.length ? list : foods.filter((f) => recommendations.some((r) => `food-${r.id}` === f.id));
  }, [activeConditions]);
  const recommendedFood = recommendFoods[recIndex % recommendFoods.length];

  const deliveryResults = useMemo(() => {
    const q = query.trim();
    let list = merchantOffers.filter((o) => {
      if (o.channel !== 'delivery') return false;
      const categoryOk = category === '全部' || o.category === category;
      const qOk = !q || `${o.merchantName}${o.dish}${o.category}${o.recommend}`.includes(q);
      return categoryOk && qOk;
    });
    if (deliveryActive.includes('30 元内')) list = list.filter((o) => o.price <= 30);
    if (deliveryActive.includes('20 分钟内')) list = list.filter((o) => o.deliveryMinutes <= 20);
    if (deliveryActive.includes('距离 1km 内')) list = list.filter((o) => distanceMeters(o.distance) <= 1000);
    if (deliveryActive.includes('清淡')) list = list.filter((o) => /清淡|清爽|少油|蒸|煮|沙拉|无糖/.test(o.recommend + o.dish));
    return [...list].sort((a, b) => sortBy === 'calories' ? a.calories - b.calories : a.deliveryMinutes - b.deliveryMinutes);
  }, [query, category, sortBy, deliveryActive]);

  const canCookCount = useMemo(() => recipes.filter((r) => r.ingredients.length > 0 && r.ingredients.every((id) => selectedIngredients.includes(id))).length, [selectedIngredients]);
  const recipeResults = useMemo(() => {
    const q = query.trim();
    let list = recipes;
    if (q) list = list.filter((r) => `${r.name}${r.tag}${r.tip}${r.ingredients.map(ingredientName).join('')}`.includes(q));
    if (selectedIngredients.length) {
      list = list.filter((r) => r.ingredients.some((id) => selectedIngredients.includes(id)));
      if (onlyCanCook) list = list.filter((r) => r.ingredients.every((id) => selectedIngredients.includes(id)));
    }
    return [...list].sort((a, b) => sortBy === 'calories' ? a.calories - b.calories : minutesFor(a) - minutesFor(b));
  }, [query, selectedIngredients, onlyCanCook, sortBy]);

  const nearbyResults = useMemo(() => {
    const q = query.trim();
    let list = merchantOffers.filter((o) => o.channel === 'nearby');
    if (q) list = list.filter((o) => `${o.merchantName}${o.dish}${o.category}${o.recommend}`.includes(q));
    if (nearbyActive.includes('步行 10 分钟')) list = list.filter((o) => distanceMeters(o.distance) <= 1000);
    if (nearbyActive.includes('是否营业')) list = list.filter((o) => o.isOpen);
    if (nearbyActive.includes('人均 30 元内')) list = list.filter((o) => o.price <= 30);
    if (nearbyActive.includes('当前菜品匹配状态') && selectedFood) list = list.filter((o) => o.foodId === selectedFood.id);
    return [...list].sort((a, b) => sortBy === 'calories' ? a.calories - b.calories : distanceMeters(a.distance) - distanceMeters(b.distance));
  }, [query, nearbyActive, sortBy, selectedFood]);

  const detailOffers = selectedFood && selectedMethod
    ? offersFor(selectedFood.id, selectedMethod === 'cook' ? 'delivery' : selectedMethod)
    : [];
  const detailRecipe = recipeForFood(selectedFood?.id);
  const impactFood = selectedFood ?? recommendedFood;
  const impact = Math.round(impactFood.calories * Math.min(10, Math.max(0.1, Number(portion) || 1)));
  const afterTotal = todayTotal + impact;
  const afterRemaining = state.calorieGoal - afterTotal;

  const resetSelection = () => {
    setSelectedFood(null);
    setSelectedSource(null);
    setSelectedMethod(null);
    setSelectedMerchant(null);
    setSelectedRecipe(null);
    setStepMode(false);
    setStepIndex(0);
    setExpandedSearch(false);
    setPortion('1');
    setConfirmOpen(false);
  };

  const switchMode = (next: Mode) => {
    if (next === mode && (next !== 'find' || findWay === 'delivery')) return;
    resetSelection();
    setSheetOpen(false);
    setMode(next);
    setFindWay(next === 'find' ? 'delivery' : null);
    setQuery('');
    setCategory('全部');
    setSortBy('calories');
    setDeliveryActive([]);
    setNearbyActive([]);
    setOptionsExpanded(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const chooseFindWay = (way: FindWay) => {
    resetSelection();
    setFindWay(way);
    setQuery('');
    setCategory('全部');
    setSortBy('calories');
    setDeliveryActive([]);
    setNearbyActive([]);
    setOptionsExpanded(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCondition = (label: string) => {
    setActiveConditions((prev) => prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]);
    setRecIndex(0);
  };

  const nextRecommendation = () => {
    setRecIndex((i) => i + 1);
    setRejects((n) => n + 1);
  };

  const openSheet = (event: MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = event.currentTarget;
    setTime(currentTime());
    setSheetOpen(true);
  };

  const openRecommendationSheet = (event: MouseEvent<HTMLButtonElement>) => {
    resetSelection();
    setSelectedFood(recommendedFood);
    setSelectedSource('recommendation');
    openSheet(event);
  };

  const chooseMethod = (next: Method) => {
    setSelectedMethod(next);
    setSelectedMerchant(offersFor(selectedFood?.id, next === 'cook' ? 'delivery' : next)[0] ?? null);
    setStepMode(false);
    setStepIndex(0);
    setExpandedSearch(false);
  };

  const openDeliveryDetail = (offer: MerchantOffer, event: MouseEvent<HTMLButtonElement>) => {
    resetSelection();
    setSelectedFood(foodById(offer.foodId));
    setSelectedSource('delivery');
    setSelectedMethod('delivery');
    setSelectedMerchant(offer);
    openSheet(event);
  };

  const openRecipeDetail = (recipe: Recipe, event: MouseEvent<HTMLButtonElement>) => {
    resetSelection();
    setSelectedFood(recipeFood(recipe));
    setSelectedSource('recipe');
    setSelectedMethod('cook');
    setSelectedRecipe(recipe);
    setSelectedIngredientsForRecipe(selectedIngredients);
    openSheet(event);
  };

  const openNearbyDetail = (offer: MerchantOffer, event: MouseEvent<HTMLButtonElement>) => {
    resetSelection();
    setSelectedFood(foodById(offer.foodId));
    setSelectedSource('nearby');
    setSelectedMethod('nearby');
    setSelectedMerchant(offer);
    openSheet(event);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setConfirmOpen(false);
    resetSelection();
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!sheetOpen && !confirmOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (confirmOpen) setConfirmOpen(false);
      else closeSheet();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sheetOpen, confirmOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    const id = window.requestAnimationFrame(() => sheetCloseRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [sheetOpen]);

  useEffect(() => {
    if (!confirmOpen) return;
    const id = window.requestAnimationFrame(() => confirmCloseRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [confirmOpen]);

  const openMap = () => {
    const position = '114.4058,30.4812';
    const url = `https://uri.amap.com/marker?position=${position}&name=${encodeURIComponent(selectedMerchant?.merchantName ?? '商家')}&src=chanban&coordinate=gaode&callnative=1`;
    notify('正在为您唤起地图...');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const confirmRecord = () => {
    if (!selectedFood) return;
    const amount = Math.min(10, Math.max(0.1, Number(portion) || 1));
    dispatch({ type: 'ADD_RECORD', record: {
      id: `eat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: todayKey(), name: selectedFood.name, calories: Math.round(selectedFood.calories * amount),
      source: 'eat', mealType: meal, time, amount, sourceLabel: '吃什么',
      feedback: '是认真选过的一餐，小馋记住啦。',
    } });
    setConfirmOpen(false);
    setSheetOpen(false);
    resetSelection();
    notify('记下来啦，今天又多清楚一点。');
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const showNoDish = (channel: 'delivery' | 'nearby') => (
    <div className="space-y-2 rounded-[18px] bg-surface p-3">
      <p className="text-[13px] font-bold text-text">{channel === 'nearby' ? '附近暂时没有这道菜。' : '附近暂时没有找到提供这道菜的商家。'}</p>
      <p className="muted leading-relaxed">小馋不拿别的菜凑数，你可以换个范围看看。</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => { setExpandedSearch(true); notify('已扩大搜索范围'); }} className="btn-secondary text-[12px]">{channel === 'nearby' ? '扩大搜索范围' : '扩大范围'}</button>
        <button type="button" onClick={() => { closeSheet(); switchMode('find'); chooseFindWay(channel); setQuery(impactFood.name.slice(0, 2)); }} className="btn-secondary text-[12px]">查看相似菜品</button>
      </div>
      {expandedSearch && similarFoods(selectedFood?.id).length > 0 && (
        <div className="animate-detail-in space-y-1 rounded-[14px] bg-card p-2">
          {similarFoods(selectedFood?.id).map((f) => <p key={f.id} className="text-[11px] text-text">{f.emoji} {f.name} · {f.calories} kcal</p>)}
        </div>
      )}
    </div>
  );

  const recipeCard = (recipe: Recipe, eventHandler: (e: MouseEvent<HTMLButtonElement>) => void) => {
    const have = recipe.ingredients.filter((id) => selectedIngredients.includes(id));
    const missing = recipe.ingredients.filter((id) => !selectedIngredients.includes(id));
    return (
      <div key={recipe.id} className="space-y-2 rounded-[18px] border border-border bg-card p-3 shadow-card">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-peachSoft text-2xl">{recipe.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-text">{recipe.name}</p>
            <p className="text-[11px] text-textMuted tabular-nums">{recipe.calories} kcal · 约 {minutesFor(recipe)} 分钟</p>
          </div>
          <button type="button" onClick={eventHandler} className="btn-deep shrink-0 px-3 py-2 text-[12px]">选这个</button>
        </div>
        <p className="text-[11px] leading-relaxed text-greenText">已有：{have.length ? have.map(ingredientName).join('、') : '无'}</p>
        <p className="text-[11px] leading-relaxed text-warn">缺少：{missing.length ? missing.map(ingredientName).join('、') : '无'}</p>
        <p className="text-[11px] leading-relaxed text-textMuted">小技巧：{recipe.tip}</p>
      </div>
    );
  };

  const detailRecipeBlock = (recipe: Recipe) => {
    const pantry = selectedIngredientsForRecipe.length ? selectedIngredientsForRecipe : selectedIngredients;
    const have = recipe.ingredients.filter((id) => pantry.includes(id));
    const missing = recipe.ingredients.filter((id) => !pantry.includes(id));
    const stepLabels = ['准备食材', '开始烹饪', '做好啦'];
    return (
      <div className="animate-detail-in space-y-3 rounded-[18px] border border-border bg-card p-3 shadow-card">
        <p className="text-[13px] font-bold text-text">{recipe.name}</p>
        <div className="flex flex-wrap gap-1.5">
          {recipe.ingredients.map((id) => (
            <span key={id} className={`rounded-[10px] px-2 py-1 text-[10px] ${pantry.includes(id) ? 'bg-greenSoft text-greenText' : 'bg-peachSoft text-peachText'}`}>
              {ingredientName(id)} {ingredientAmount[id] ?? '适量'}
            </span>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-greenText">已有食材：{have.length ? have.map(ingredientName).join('、') : '无'}</p>
        <p className="text-[11px] leading-relaxed text-warn">缺少食材：{missing.length ? missing.map(ingredientName).join('、') : '无'}</p>
        <p className="muted leading-relaxed">制作步骤：{recipe.steps.join(' ')}</p>
        <p className="text-[11px] text-greenText tabular-nums">制作时间约 {minutesFor(recipe)} 分钟 · 预计热量 {recipe.calories} kcal · 当前份数 {portion || '1'} 份</p>
        {!stepMode && (
          <>
            <button type="button" onClick={() => { setStepMode(true); setStepIndex(0); }} className="btn-deep w-full">开始做</button>
            <button type="button" onClick={() => setConfirmOpen(true)} className="min-h-[44px] w-full text-[12px] font-bold text-primary">我做好了</button>
          </>
        )}
        {stepMode && (
          <div className="space-y-2 rounded-[16px] bg-greenSoft p-3">
            <p className="text-[12px] font-bold text-greenText tabular-nums">{stepIndex + 1}/{stepLabels.length} · {stepLabels[stepIndex]}</p>
            <p className="text-[13px] leading-relaxed text-text">{recipe.steps[Math.min(stepIndex, recipe.steps.length - 1)]}</p>
            {stepIndex < stepLabels.length - 1 ? (
              <div className="flex gap-2">
                <button type="button" onClick={() => setStepIndex((i) => i + 1)} className="btn-deep flex-1">下一步</button>
                <button type="button" onClick={() => setStepIndex(stepLabels.length - 1)} className="btn-secondary shrink-0 px-3 text-[12px]">跳到结尾</button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmOpen(true)} className="btn-deep w-full">我吃到了</button>
            )}
          </div>
        )}
      </div>
    );
  };

  const deliveryDetailBlock = (offer: MerchantOffer) => (
    <div className="animate-detail-in space-y-2 rounded-[18px] border border-border bg-card p-3 shadow-card">
      <p className="text-[13px] font-bold text-text tabular-nums">{offer.merchantName} · ¥{offer.price} · {offer.deliveryMinutes} 分钟送达</p>
      <p className="muted leading-relaxed">当前菜品：{offer.dish} · {offer.calories} kcal</p>
      <p className="text-[11px] leading-relaxed text-greenText">推荐组合：{offer.recommend}</p>
      <p className="text-[11px] leading-relaxed text-warn">注意事项：{offer.avoid}</p>
      <p className="text-[11px] text-textMuted tabular-nums">距离 {offer.distance}</p>
      <button type="button" onClick={() => notify('演示版：已为你准备好下单信息')} className="btn-secondary w-full">去下单</button>
    </div>
  );

  const nearbyDetailBlock = (offer: MerchantOffer) => (
    <div className="animate-detail-in space-y-2 rounded-[18px] border border-border bg-card p-3 shadow-card">
      <p className="text-[13px] font-bold text-text">{offer.merchantName}</p>
      <p className="muted leading-relaxed">地址：{offer.address}</p>
      <p className="text-[11px] leading-relaxed text-greenText">当前菜品：{offer.dish} · ¥{offer.price} · {offer.isOpen ? '有售' : '暂时售罄'}</p>
      <p className="text-[11px] text-textMuted tabular-nums">距离 {offer.distance} · 预计到店 {offer.etaMinutes} 分钟 · {offer.isOpen ? '营业中 10:00-21:00' : '休息中'}</p>
      <button type="button" onClick={openMap} className="btn-secondary w-full">导航</button>
    </div>
  );

  return (
    <div className="eat-page mx-auto min-h-screen w-full max-w-[430px] space-y-4 px-5 pb-32 pt-1">
      <SubPageHeader title={`${mealLabels[meal]}，吃什么？`} subtitle="先走一条路径，再选具体食物" backTo="/record" />

      <div className="grid grid-cols-2 gap-1.5 rounded-[18px] bg-surface p-1.5">
        {([['recommend', '小馋推荐'], ['find', '自己找']] as [Mode, string][]).map(([id, label]) => (
          <button key={id} type="button" onClick={() => switchMode(id)} aria-pressed={mode === id}
            className={`min-h-[44px] rounded-[13px] text-[13px] font-bold transition-colors ${mode === id ? 'bg-card text-primaryDeep shadow-card' : 'bg-transparent text-textMuted'}`}>
            {label}
          </button>
        ))}
      </div>

      <div key={`${mode}-${findWay ?? ''}`} className="animate-fade-in space-y-3">
        {mode === 'recommend' ? (
          <>
            <section className="rounded-[22px] bg-surface p-3">
              <div className={optionsExpanded ? 'flex flex-wrap gap-2 pb-1' : 'no-scrollbar flex gap-2 overflow-x-auto pb-1'}>
                {conditions.map((label) => {
                  const active = activeConditions.includes(label);
                  return (
                    <button key={label} type="button" onClick={() => toggleCondition(label)}
                      className={`filter-chip min-h-[44px] shrink-0 border ${active ? 'border-greenSoft bg-greenSoft text-greenText' : 'border-border bg-card text-text'}`}>
                      {active && <Icon name="check" size={13} className="mr-1 inline text-primary" />}{label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section key={`${recommendedFood.id}-${recIndex}`} className="animate-refresh space-y-3 rounded-[24px] bg-peachSoft p-4 shadow-card">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-peachText"><Icon name="sparkle" size={15} />小馋推荐</p>
                <span className="chip bg-card px-2.5 py-1 text-[10px] text-text/80">{recommendedFood.tag}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-card text-3xl shadow-card">{recommendedFood.emoji}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[19px] font-bold text-text">{recommendedFood.name}</h2>
                  <p className="muted mt-0.5 leading-relaxed">{recommendedFood.desc}</p>
                  <p className="mt-1 text-[11px] font-medium text-text/80 tabular-nums">{recommendedFood.calories} kcal · ¥{recommendedFood.price} · 约 {recommendedFood.minutes} 分钟</p>
                </div>
              </div>
              <div className="space-y-1 rounded-[18px] bg-cyanSoft p-3 text-[11px] leading-relaxed text-cyanText tabular-nums">
                <p>今日摄入预计 {todayTotal} / {state.calorieGoal} kcal</p>
                <p>吃完后约 {todayTotal + recommendedFood.calories} / {state.calorieGoal} kcal</p>
                <p>剩余额度约 {state.calorieGoal - todayTotal - recommendedFood.calories} kcal</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={openRecommendationSheet} className="btn-deep text-[13px]">选它，继续</button>
                <button type="button" onClick={nextRecommendation} className="btn-secondary text-[13px]">换一个</button>
              </div>
              {rejects >= 3 && (
                <div className="flex items-center justify-between gap-2 rounded-2xl bg-card px-3 py-2">
                  <p className="text-[11px] text-peachText">还没找到喜欢的？</p>
                  <button type="button" onClick={() => switchMode('find')} className="min-h-[44px] px-2 text-[12px] font-bold text-primary">切换到自己找 →</button>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {findWayMeta.map((way) => {
                const active = findWay === way.id;
                return (
                  <button key={way.id} type="button" onClick={() => chooseFindWay(way.id)} aria-pressed={active}
                    className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-[18px] ${way.tint} text-text shadow-card ${active ? 'border-2 border-primaryDeep' : 'border-2 border-transparent'}`}>
                    <span className="flex items-center gap-1">
                      {active && <Icon name="check" size={13} strokeWidth={2.4} />}
                      <Icon name={way.icon} size={21} />
                    </span>
                    <span className="text-[13px] font-bold">{way.label}</span>
                  </button>
                );
              })}
            </div>

            {findWay && (
              <>
                <p className="text-[11px] text-textMuted">{findWay === 'delivery' ? '外卖攻略' : findWay === 'recipe' ? '冰箱里有什么' : '附近好店'}</p>

                {findWay === 'delivery' && (
                  <>
                    <div className="space-y-3 rounded-[22px] bg-surface p-3">
                      <div className="flex items-center gap-2 rounded-2xl border border-[#CBD8CC] bg-card px-3.5 py-3 shadow-card">
                        <Icon name="search" size={17} className="shrink-0 text-textMuted" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索品牌、菜品或外卖攻略"
                          className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-[#78827A]" />
                        {query && <button type="button" onClick={() => setQuery('')} className="shrink-0 text-textMuted" aria-label="清空"><Icon name="close" size={15} /></button>}
                      </div>
                      <div className={optionsExpanded ? 'flex flex-wrap gap-2 pb-1' : 'no-scrollbar flex gap-2 overflow-x-auto pb-1'}>
                        {deliveryCategories.map((c) => (
                          <button key={c} type="button" onClick={() => setCategory(c)}
                            className={`filter-chip min-h-[44px] shrink-0 border ${category === c ? 'border-primary bg-primary text-primaryText' : 'border-border bg-card text-text'}`}>{c}</button>
                        ))}
                      </div>
                      <div className={optionsExpanded ? 'flex flex-wrap gap-2 pb-1' : 'no-scrollbar flex gap-2 overflow-x-auto pb-1'}>
                        {deliveryFilters.map((label) => {
                          const active = deliveryActive.includes(label);
                          return (
                            <button key={label} type="button" onClick={() => setDeliveryActive((p) => active ? p.filter((x) => x !== label) : [...p, label])}
                              className={`filter-chip min-h-[44px] shrink-0 border ${active ? 'border-greenSoft bg-greenSoft text-greenText' : 'border-border bg-card text-text'}`}>
                              {active && <Icon name="check" size={13} className="mr-1 inline text-primary" />}{label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <button type="button" onClick={() => setOptionsExpanded((v) => !v)} className="min-h-[44px] shrink-0 text-[12px] font-medium text-primary">
                          {optionsExpanded ? '收起' : '展示全部'}
                        </button>
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="muted shrink-0 tabular-nums">{deliveryResults.length} 个结果</p>
                          <button type="button" onClick={() => setSortBy(sortBy === 'calories' ? 'minutes' : 'calories')} className="min-h-[44px] shrink-0 text-[11px] text-primary">
                            {sortBy === 'calories' ? '按热量从低到高' : '按送达时间'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <section className="space-y-2">
                      {deliveryResults.map((o) => (
                        <div key={o.id} className="space-y-1.5 rounded-[18px] border border-border bg-card p-3 shadow-card">
                          <div className="flex items-start gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-greenSoft text-xl">{foodById(o.foodId)?.emoji ?? '🍽️'}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-bold text-text">{o.merchantName}</p>
                              <p className="truncate text-[12px] text-textMuted">{o.dish}</p>
                              <p className="text-[11px] text-textMuted tabular-nums">{o.calories} kcal · ¥{o.price} · {o.distance} · {o.deliveryMinutes} 分钟</p>
                            </div>
                            <button type="button" onClick={(e) => openDeliveryDetail(o, e)} className="btn-deep shrink-0 px-3 py-2 text-[12px]">选这个</button>
                          </div>
                          <p className="text-[11px] leading-relaxed text-greenText">推荐组合：{o.recommend}</p>
                          <p className="text-[11px] leading-relaxed text-warn">注意：{o.avoid}</p>
                        </div>
                      ))}
                      {deliveryResults.length === 0 && <p className="rounded-[18px] bg-card p-4 text-center text-[12px] text-textMuted">没有找到相关外卖，换个词试试。</p>}
                    </section>
                  </>
                )}

                {findWay === 'recipe' && (
                  <>
                    <div className="space-y-3 rounded-[22px] bg-surface p-3">
                      <div className="flex items-center gap-2 rounded-2xl border border-[#CBD8CC] bg-card px-3.5 py-3 shadow-card">
                        <Icon name="search" size={17} className="shrink-0 text-textMuted" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索食材或菜谱"
                          className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-[#78827A]" />
                        {query && <button type="button" onClick={() => setQuery('')} className="shrink-0 text-textMuted" aria-label="清空"><Icon name="close" size={15} /></button>}
                      </div>
                      <div className={optionsExpanded ? 'flex flex-wrap gap-2 pb-1' : 'no-scrollbar flex gap-2 overflow-x-auto pb-1'}>
                        {ingredients.filter((item) => !query || item.name.includes(query)).map((item) => {
                          const active = selectedIngredients.includes(item.id);
                          return (
                            <button key={item.id} type="button" onClick={() => { setSelectedIngredients((p) => active ? p.filter((id) => id !== item.id) : [...p, item.id]); setSelectedRecipe(null); }}
                              className={`filter-chip min-h-[44px] shrink-0 border ${active ? 'border-primary bg-primary text-primaryText' : 'border-border bg-card text-text'}`}>
                              {item.emoji} {item.name}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <button type="button" onClick={() => setOptionsExpanded((v) => !v)} className="min-h-[44px] shrink-0 text-[12px] font-medium text-primary">
                          {optionsExpanded ? '收起' : '展示全部'}
                        </button>
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="muted hidden min-w-0 truncate tabular-nums sm:block">已选 {selectedIngredients.length} 样 · 能做 {canCookCount} 道</p>
                          <button type="button" onClick={() => setSelectedIngredients([])} className="min-h-[44px] shrink-0 text-[11px] text-primary">清空已选</button>
                          <button type="button" onClick={() => setOnlyCanCook(!onlyCanCook)} className={`min-h-[44px] shrink-0 text-[11px] ${onlyCanCook ? 'font-bold text-primaryDeep' : 'text-primary'}`}>
                            {onlyCanCook ? '✓ 只看我能做的' : '只看我能做的'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <section className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-textMuted tabular-nums">{recipeResults.length} 道菜谱</p>
                        <div className="flex shrink-0 gap-2">
                          <button type="button" onClick={() => setSortBy('calories')} className={`min-h-[44px] px-1.5 text-[11px] ${sortBy === 'calories' ? 'font-bold text-primaryDeep' : 'text-primary'}`}>按热量排序</button>
                          <button type="button" onClick={() => setSortBy('minutes')} className={`min-h-[44px] px-1.5 text-[11px] ${sortBy === 'minutes' ? 'font-bold text-primaryDeep' : 'text-primary'}`}>按制作时间排序</button>
                        </div>
                      </div>
                      {recipeResults.map((r) => recipeCard(r, (e) => openRecipeDetail(r, e)))}
                      {recipeResults.length === 0 && (
                        <div className="space-y-2 rounded-[18px] bg-surface p-4">
                          <p className="text-[13px] font-bold text-text">这些食材暂时没有匹配菜谱。</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setSelectedIngredients((p) => p.slice(0, -1))} className="btn-secondary text-[12px]">减少一个食材</button>
                            <button type="button" onClick={() => { setSelectedIngredients([]); setOnlyCanCook(false); }} className="btn-secondary text-[12px]">清空食材重新选择</button>
                          </div>
                        </div>
                      )}
                    </section>
                  </>
                )}

                {findWay === 'nearby' && (
                  <>
                    <div className="space-y-3 rounded-[22px] bg-surface p-3">
                      <div className="flex items-center gap-2 rounded-2xl border border-[#CBD8CC] bg-card px-3.5 py-3 shadow-card">
                        <Icon name="search" size={17} className="shrink-0 text-textMuted" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索菜品、菜系或商家"
                          className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-[#78827A]" />
                        {query && <button type="button" onClick={() => setQuery('')} className="shrink-0 text-textMuted" aria-label="清空"><Icon name="close" size={15} /></button>}
                      </div>
                      <div className={optionsExpanded ? 'flex flex-wrap gap-2 pb-1' : 'no-scrollbar flex gap-2 overflow-x-auto pb-1'}>
                        {nearbyFilters.map((label) => {
                          const active = nearbyActive.includes(label);
                          return (
                            <button key={label} type="button" onClick={() => { setNearbyActive((p) => active ? p.filter((x) => x !== label) : [...p, label]); setSelectedMerchant(null); }}
                              className={`filter-chip min-h-[44px] shrink-0 border ${active ? 'border-greenSoft bg-greenSoft text-greenText' : 'border-border bg-card text-text'}`}>
                              {active && <Icon name="check" size={13} className="mr-1 inline text-primary" />}{label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <button type="button" onClick={() => setOptionsExpanded((v) => !v)} className="min-h-[44px] shrink-0 text-[12px] font-medium text-primary">
                          {optionsExpanded ? '收起' : '展示全部'}
                        </button>
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="muted shrink-0 tabular-nums">{nearbyResults.length} 家店</p>
                          <button type="button" onClick={() => setSortBy('calories')} className={`min-h-[44px] shrink-0 text-[11px] ${sortBy === 'calories' ? 'font-bold text-primaryDeep' : 'text-primary'}`}>按热量排序</button>
                          <button type="button" onClick={() => setSortBy('minutes')} className={`min-h-[44px] shrink-0 text-[11px] ${sortBy === 'minutes' ? 'font-bold text-primaryDeep' : 'text-primary'}`}>距离排序</button>
                        </div>
                      </div>
                    </div>
                    <section className="space-y-2">
                      {nearbyResults.map((o) => (
                        <div key={o.id} className="space-y-1.5 rounded-[18px] border border-border bg-card p-3 shadow-card">
                          <div className="flex items-start gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyanSoft text-xl">{foodById(o.foodId)?.emoji ?? '📍'}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-bold text-text">{o.merchantName}</p>
                              <p className="truncate text-[12px] text-textMuted">{o.dish}{selectedFood ? (o.foodId === selectedFood.id ? ' · 提供当前菜' : ' · 非当前菜') : ''}</p>
                              <p className="text-[11px] text-textMuted tabular-nums">¥{o.price} · {o.distance} · 到店约 {o.etaMinutes} 分钟 · {o.isOpen ? '营业中' : '休息中'}</p>
                            </div>
                            <button type="button" onClick={(e) => openNearbyDetail(o, e)} className="btn-deep shrink-0 px-3 py-2 text-[12px]">选这家</button>
                          </div>
                          <p className="text-[11px] leading-relaxed text-greenText">{o.recommend}</p>
                        </div>
                      ))}
                      {nearbyResults.length === 0 && (
                        <div className="space-y-2 rounded-[18px] bg-surface p-4">
                          <p className="text-[13px] font-bold text-text">附近暂时没有这道菜。</p>
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setNearbyActive([])} className="btn-secondary text-[12px]">扩大范围</button>
                            <button type="button" onClick={() => { chooseFindWay('delivery'); setQuery(impactFood.name.slice(0, 2)); }} className="btn-secondary text-[12px]">查看相似菜品</button>
                          </div>
                        </div>
                      )}
                    </section>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-[430px] -translate-x-1/2 items-center justify-between gap-3 border-t border-border bg-card px-5 py-3 shadow-card">
        <p className="min-w-0 truncate text-[12px] text-text tabular-nums">
          今日已摄入 <span className="font-bold text-text">{todayTotal}</span> / {state.calorieGoal} kcal
        </p>
        <Link to="/record" className="btn-deep shrink-0 px-4 py-2 text-[12px]">去记录 →</Link>
      </div>

      {sheetOpen && selectedFood && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center">
          <div className="absolute inset-0 bg-text/40" onClick={closeSheet} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-labelledby="sheet-title" className="animate-sheet-up relative flex h-[74vh] max-h-[760px] w-[calc(100%-24px)] max-w-[406px] flex-col rounded-t-[26px] bg-card shadow-modal">
            <div className="flex shrink-0 justify-center pt-3"><span className="h-1.5 w-10 rounded-full bg-border" /></div>
            <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-3">
              <div className="min-w-0">
                <p className="text-[10px] text-textMuted">{selectedSource === 'recommendation' ? '小馋推荐' : selectedSource === 'delivery' ? '外卖' : selectedSource === 'recipe' ? '菜谱' : '附近商家'}</p>
                <h2 id="sheet-title" className="text-[18px] font-bold text-text">{selectedSource === 'recommendation' ? '这餐已选择' : '已选详情'}</h2>
              </div>
              <button ref={sheetCloseRef} type="button" onClick={closeSheet} className="icon-btn h-11 w-11 shrink-0" aria-label="关闭"><Icon name="close" size={19} /></button>
            </div>

            <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-5 pb-4">
              <div className="flex items-center gap-3 rounded-[18px] bg-greenSoft p-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-card text-2xl">{selectedFood.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-text">{selectedFood.name}</p>
                  <p className="text-[11px] text-greenText tabular-nums">{selectedFood.calories} kcal · 今日已摄入 {todayTotal} kcal</p>
                </div>
              </div>
              <div className="space-y-1 rounded-[18px] bg-cyanSoft p-3 text-[11px] leading-relaxed text-cyanText tabular-nums">
                <p>吃完后预计：{afterTotal} / {state.calorieGoal} kcal</p>
                <p>今日剩余额度：约 {afterRemaining} kcal</p>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={closeSheet} className="min-h-[44px] px-2 text-[12px] font-bold text-primary">改食物</button>
              </div>

              {selectedSource === 'recommendation' && (
                <>
                  <p className="text-[13px] font-bold text-text">准备怎么吃？</p>
                  <div className="grid grid-cols-3 gap-2">
                    {methodMeta.map((m) => {
                      const active = selectedMethod === m.id;
                      return (
                        <button key={m.id} type="button" onClick={() => chooseMethod(m.id)}
                          className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[16px] ${m.tint} text-text ${active ? 'border-2 border-primaryDeep' : 'border-2 border-transparent'}`}>
                          <span className="flex items-center gap-1 text-[12px] font-bold">{active && <Icon name="check" size={13} strokeWidth={2.4} />}{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedMethod === 'delivery' && (detailOffers.length > 0
                    ? detailOffers.map((o) => (
                        <div key={o.id} className="animate-detail-in space-y-2 rounded-[18px] border border-border bg-card p-3 shadow-card">
                          <p className="text-[13px] font-bold text-text tabular-nums">{o.merchantName} · {o.dish}</p>
                          <p className="muted leading-relaxed tabular-nums">¥{o.price} · {o.deliveryMinutes} 分钟送达 · 距离 {o.distance}</p>
                          <p className="text-[11px] leading-relaxed text-greenText">推荐组合：{o.recommend}</p>
                          <p className="text-[11px] leading-relaxed text-warn">注意事项：{o.avoid}</p>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => notify('演示版：已为你准备好下单信息')} className="btn-secondary flex-1 text-[12px]">去下单</button>
                            <button type="button" onClick={() => setSelectedMerchant(o)} className={`flex-1 text-[12px] ${selectedMerchant?.id === o.id ? 'btn-deep' : 'btn-secondary'}`}>{selectedMerchant?.id === o.id ? '✓ 已选这家' : '选这家'}</button>
                          </div>
                        </div>
                      ))
                    : showNoDish('delivery'))}
                  {selectedMethod === 'cook' && (detailRecipe
                    ? detailRecipeBlock(detailRecipe)
                    : <div className="space-y-2 rounded-[18px] bg-surface p-3"><p className="text-[13px] font-bold text-text">暂时没有这道菜的菜谱。</p><button type="button" onClick={() => { closeSheet(); switchMode('find'); chooseFindWay('recipe'); }} className="btn-secondary w-full">查看相似菜谱</button></div>)}
                  {selectedMethod === 'nearby' && (detailOffers.length > 0
                    ? detailOffers.map((o) => (
                        <div key={o.id} className="animate-detail-in space-y-2 rounded-[18px] border border-border bg-card p-3 shadow-card">
                          <p className="text-[13px] font-bold text-text tabular-nums">{o.merchantName} · {o.dish}</p>
                          <p className="muted leading-relaxed tabular-nums">¥{o.price} · {o.distance} · 到店约 {o.etaMinutes} 分钟 · {o.isOpen ? '营业中' : '休息中'}</p>
                          <p className="text-[11px] text-textMuted">地址：{o.address}</p>
                          <div className="flex gap-2">
                            <button type="button" onClick={openMap} className="btn-secondary flex-1 text-[12px]">导航</button>
                            <button type="button" onClick={() => setSelectedMerchant(o)} className={`flex-1 text-[12px] ${selectedMerchant?.id === o.id ? 'btn-deep' : 'btn-secondary'}`}>{selectedMerchant?.id === o.id ? '✓ 已选这家' : '选这家'}</button>
                          </div>
                        </div>
                      ))
                    : showNoDish('nearby'))}
                </>
              )}

              {selectedSource === 'delivery' && selectedMerchant && deliveryDetailBlock(selectedMerchant)}
              {selectedSource === 'recipe' && selectedRecipe && detailRecipeBlock(selectedRecipe)}
              {selectedSource === 'nearby' && selectedMerchant && nearbyDetailBlock(selectedMerchant)}
            </div>

            <div className="shrink-0 border-t border-border bg-card px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
              <button type="button" onClick={() => setConfirmOpen(true)}
                disabled={selectedSource === 'recommendation' && !selectedMethod}
                className="btn-deep w-full min-h-[50px]">我吃到了</button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && selectedFood && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-text/40" onClick={() => setConfirmOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="animate-pop-in relative w-full max-w-[330px] rounded-[24px] bg-card p-5 shadow-modal">
            <div className="mb-4 flex items-center gap-2.5">
              <Hamster size={44} />
              <h3 id="confirm-title" className="min-w-0 flex-1 text-[17px] font-bold text-text">确认这一餐</h3>
              <button ref={confirmCloseRef} type="button" onClick={() => setConfirmOpen(false)} className="icon-btn h-11 w-11 shrink-0" aria-label="关闭"><Icon name="close" size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-[18px] bg-peachSoft p-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-card text-2xl">{selectedFood.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-text">{selectedFood.name}</p>
                  <p className="muted tabular-nums">{selectedFood.calories} kcal · 认真选过的一餐，值得被记住。</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="rounded-2xl bg-surface p-2.5 text-[11px] text-textMuted">份数
                  <input value={portion} onChange={(e) => setPortion(e.target.value)} inputMode="decimal" className="w-full bg-transparent text-[13px] font-bold text-text outline-none" />
                </label>
                <label className="rounded-2xl bg-surface p-2.5 text-[11px] text-textMuted">餐次
                  <select value={meal} onChange={(e) => setMeal(e.target.value as MealType)} className="w-full bg-transparent text-[13px] font-bold text-text outline-none">
                    {(['breakfast', 'lunch', 'dinner', 'snack', 'late'] as MealType[]).map((m) => <option key={m} value={m}>{mealLabels[m]}</option>)}
                  </select>
                </label>
              </div>
              <label className="block rounded-2xl bg-surface p-2.5 text-[11px] text-textMuted">时间
                <input value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-transparent text-[13px] font-bold text-text outline-none" />
              </label>
              <p className="muted text-center text-[10px]">小馋提醒：只有点击「确认记录」后，才会写进今日摄入。</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirmOpen(false)} className="btn-secondary text-[13px]">再看看</button>
                <button type="button" onClick={confirmRecord} className="btn-deep text-[13px]">确认记录</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
