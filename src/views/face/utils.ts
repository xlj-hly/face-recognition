/**
 * 人脸识别工具函数
 */

import type { EmotionData, GenderData, HistoryBuffers } from './types';

/**
 * 英文情绪标签转中文映射
 * @param name 英文情绪名称
 * @returns 对应的中文情绪名称
 */
export const translateEmotionName = (name: string): string => {
  const map: Record<string, string> = {
    neutral: '平静',
    happy: '高兴',
    sad: '伤心',
    angry: '生气',
    surprise: '惊讶',
    fear: '恐惧',
    disgust: '厌恶',
    contempt: '轻蔑',
  };
  return map[name] || name;
};

/**
 * 滑动窗口数据管理工具
 * 将新数据添加到数组末尾，如果超过限制则移除最旧的数据
 * @param arr 目标数组
 * @param item 要添加的新数据
 * @param limit 窗口大小限制
 */
export const pushWithLimit = <T,>(arr: T[], item: T, limit: number): void => {
  arr.push(item);
  if (arr.length > limit) arr.shift();
};

/**
 * 情绪平滑算法：基于众数和平均分的混合策略
 * 算法逻辑：
 * 1. 统计每种情绪的出现次数和总分
 * 2. 优先选择出现次数最多的情绪
 * 3. 如果出现次数相同，选择平均分更高的
 * @param emotionHistory 情绪历史数据
 * @returns 平滑后的情绪结果 {name, score} 或 null
 */
export const getSmoothedEmotion = (emotionHistory: EmotionData[]): EmotionData | null => {
  if (emotionHistory.length === 0) return null;
  
  // 统计每种情绪的出现次数和总分
  const counter = new Map<string, { count: number; total: number }>();
  for (const e of emotionHistory) {
    const prev = counter.get(e.name) || { count: 0, total: 0 };
    counter.set(e.name, { count: prev.count + 1, total: prev.total + e.score });
  }
  
  // 找到最佳情绪：优先考虑出现次数，其次考虑平均分
  let bestName: string | null = null;
  let bestCount = -1;
  let bestAvg = -1;
  counter.forEach((v, k) => {
    const avg = v.total / v.count;
    if (v.count > bestCount || (v.count === bestCount && avg > bestAvg)) {
      bestName = k;
      bestCount = v.count;
      bestAvg = avg;
    }
  });
  
  return bestName != null ? { name: bestName, score: Math.round(bestAvg * 100) } : null;
};

/**
 * 性别平滑算法：基于众数统计
 * 算法逻辑：
 * 1. 统计每种性别的出现次数和总分
 * 2. 选择出现次数最多的性别
 * 3. 计算该性别的平均置信度
 * @param genderHistory 性别历史数据
 * @returns 平滑后的性别结果 {gender, score} 或 {gender: null, score: null}
 */
export const getSmoothedGender = (genderHistory: GenderData[]): { gender: string | null; score: number | null } => {
  if (genderHistory.length === 0) return { gender: null, score: null };
  
  // 统计每种性别的出现次数和总分
  const counter = new Map<string, { count: number; total: number }>();
  for (const g of genderHistory) {
    const prev = counter.get(g.gender) || { count: 0, total: 0 };
    counter.set(g.gender, { count: prev.count + 1, total: prev.total + g.score });
  }
  
  // 找到出现次数最多的性别
  let bestGender: string | null = null;
  let bestCount = -1;
  counter.forEach((v, k) => {
    if (v.count > bestCount) {
      bestCount = v.count;
      bestGender = k;
    }
  });
  
  // 计算最佳性别的平均置信度
  const stats = bestGender ? counter.get(bestGender) : undefined;
  const avg = stats ? Math.round((stats.total / stats.count) * 100) : null;
  return { gender: bestGender, score: avg };
};

/**
 * 年龄平滑算法：简单算术平均
 * @param ageHistory 年龄历史数据
 * @returns 平滑后的年龄值（保留一位小数）或 null
 */
export const getSmoothedAge = (ageHistory: number[]): number | null => {
  if (ageHistory.length === 0) return null;
  const sum = ageHistory.reduce((a, b) => a + b, 0);
  return Math.round((sum / ageHistory.length) * 10) / 10;
};

/**
 * 初始化历史缓冲区
 * @returns 空的历史缓冲区对象
 */
export const createHistoryBuffers = (): HistoryBuffers => ({
  emotion: [],
  gender: [],
  age: [],
});
