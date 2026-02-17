
export enum UserRole {
  PLAYER = 'PLAYER',
  TEACHER = 'TEACHER'
}

export enum Difficulty {
  EASY = 'Dễ',
  MEDIUM = 'Trung bình',
  HARD = 'Khó'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
  MATCHING = 'MATCHING'
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  level: number;
  text: string;
  options?: string[];
  answer: string | string[];
  matchingPairs?: MatchingPair[];
  subject?: string;
}

export interface Account {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

export interface User {
  username: string;
  role: UserRole;
  avatar: string;
  xp: number;
  totalScore: number;
  unlockedLevels: Record<Difficulty, number>;
  groupName?: string;
  groupAvatar?: string;
  subject?: string;
}

export interface QuizResult {
  username: string;
  groupName?: string;
  groupAvatar?: string;
  subject?: string;
  difficulty: string;
  level: number;
  score: number;
  correctCount: number;
  timestamp: string;
}

export interface QuizSession {
  difficulty: Difficulty;
  level: number;
  questions: Question[];
}

export interface LeaderboardEntry {
  username: string;
  avatar: string;
  score: number;
}
