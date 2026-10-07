export enum GameState {
  INTRO = 'INTRO',
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  BANANA_HELD = 'BANANA_HELD',
  WON = 'WON',
  LOST = 'LOST',
  PAUSED = 'PAUSED',
}

export interface GameStats {
  timeElapsed: number;
  bananaHolder: 'NONE' | 'PLAYER' | 'AI';
  enemiesEvaded: number;
}
