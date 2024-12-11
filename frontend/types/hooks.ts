import { DailyNutrition, Meal } from './store';

export interface CalorieTrackerHook {
  calories: number;
  addCalories: (amount: number) => void;
  resetCalories: () => void;
  loading: boolean;
  error: string | null;
}

export interface MacroTrackerHook {
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  addMacros: (protein: number, carbs: number, fat: number) => void;
  resetMacros: () => void;
  loading: boolean;
  error: string | null;
}

export interface NutrientCalculationsHook {
  calculatedNutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  loading: boolean;
  error: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  caloriesBurned: number;
  duration: number;
  date: string;
}

export interface ExercisesHook {
  exercises: Exercise[];
  addExercise: (exercise: Omit<Exercise, 'id'>) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface Filter {
  id: string;
  name: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean' | 'date';
}

export interface FiltersHook {
  filters: Filter[];
  addFilter: (filter: Omit<Filter, 'id'>) => void;
  removeFilter: (id: string) => void;
  clearFilters: () => void;
}

export interface ErrorHandler {
  (error: any): void;
}
