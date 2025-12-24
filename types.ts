
export enum GameState {
  LOBBY = 'LOBBY',
  CALIBRATING = 'CALIBRATING',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  LOADING = 'LOADING'
}

export interface Point {
  x: number;
  y: number;
}

export interface Target {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  health: number;
  type: 'basic' | 'fast' | 'heavy' | 'boss';
  points: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface MissionData {
  title: string;
  briefing: string;
  objective: string;
}
