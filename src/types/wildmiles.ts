export type Challenge = {
  title: string;
  instruction: string;
  type: string;
  requiresPhoto: boolean;
  xp: number;
};

export type Quest = {
  title: string;
  summary: string;
  warmup: string;

  challenges: {
    movement: Challenge;
    exploration: Challenge;
    photo: Challenge;
    finish: Challenge;
  };

  completionBonus: number;
  totalXp: number;

  settings: {
    duration: number;
    difficulty: string;
    mode: string;
  };
};

export type RunPoint = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

export type QuestCheckpoint = {
  type: string;
  title: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  distanceKm: number;
};

export type PhotoVerificationResult = {
  verified: boolean;
  confidence: number;
  reason: string;
  observation: string;
};

export type RunRecap = {
  title: string;
  recap: string;
  highlight: string;
  closingLine: string;
};

export type PlayerLevel = {
  level: number;
  name: string;
  emoji: string;
  nextLevelXp: number | null;
};

export type Badge = {
  name: string;
  emoji: string;
  description: string;
};