// frontend/types/store.ts

export interface User {
  id: string;
  email?: string;
  displayName?: string;
  isGuest?: boolean;
  preferences?: UserPreferences;
  goals?: UserGoals;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  measurementUnit: 'metric' | 'imperial';
  notifications: boolean;
}

export interface UserGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: Meal[];
  water: number;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  timeConsumed: string;
}

export interface AuthState {
  user: User | null;
  authToken: string | null;
  firebaseToken: string | null;
  loading: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserData: (force?: boolean) => Promise<void>;
}

export interface NutritionState {
  dailyNutrition: DailyNutrition | null;
  isLoading: boolean;
  error: string | null;
  cache: Map<string, DailyNutrition>;
  lastFetch: Map<string, number>;
  fetchDailyNutrition: (date: Date, force?: boolean) => Promise<DailyNutrition>;
  updateDailyNutrition: (date: Date, data: Partial<DailyNutrition>) => Promise<DailyNutrition>;
  clearCache: () => void;
}

export interface CacheState {
  data: Map<string, any>;
  lastFetch: Map<string, number>;
  get: <T>(key: string) => T | null;
  set: <T>(key: string, value: T, ttl?: number) => void;
  invalidate: (key: string) => void;
  clearAll: () => void;
}
