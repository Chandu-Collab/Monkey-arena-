export type DifficultyMode = 'EASY' | 'MEDIUM' | 'HARD';

export interface DifficultyConfig {
  mode: DifficultyMode;
  label: string;
  bombSpawnIntervalMin: number;
  bombSpawnIntervalMax: number;
  bombFallDuration: number;
  portalSpeed: number;
  enemyChaseSpeed: number;
  enemyBaseSpeed: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyMode, DifficultyConfig> = {
  EASY: {
    mode: 'EASY',
    label: '🟢 Easy',
    bombSpawnIntervalMin: 1.3,
    bombSpawnIntervalMax: 1.8,
    bombFallDuration: 1.6,
    portalSpeed: 3.2,
    enemyChaseSpeed: 6.8,
    enemyBaseSpeed: 4.0,
  },
  MEDIUM: {
    mode: 'MEDIUM',
    label: '🟡 Medium',
    bombSpawnIntervalMin: 0.8,
    bombSpawnIntervalMax: 1.2,
    bombFallDuration: 1.25,
    portalSpeed: 4.8,
    enemyChaseSpeed: 8.4,
    enemyBaseSpeed: 4.8,
  },
  HARD: {
    mode: 'HARD',
    label: '🔴 Difficult',
    bombSpawnIntervalMin: 0.45,
    bombSpawnIntervalMax: 0.75,
    bombFallDuration: 0.9,
    portalSpeed: 6.5,
    enemyChaseSpeed: 9.6,
    enemyBaseSpeed: 5.5,
  },
};
