// frontend/types/hooks.js

/**
 * @typedef {Object} CalorieTrackerHook
 * @property {number} calories
 * @property {function(number): void} addCalories
 * @property {function(): void} resetCalories
 * @property {boolean} loading
 * @property {string|null} error
 */

/**
 * @typedef {Object} MacroTrackerHook
 * @property {{protein: number, carbs: number, fat: number}} macros
 * @property {function(number, number, number): void} addMacros
 * @property {function(): void} resetMacros
 * @property {boolean} loading
 * @property {string|null} error
 */

/**
 * @typedef {Object} NutrientCalculationsHook
 * @property {{calories: number, protein: number, carbs: number, fat: number}} calculatedNutrients
 * @property {boolean} loading
 * @property {string|null} error
 */

/**
 * @typedef {Object} Exercise
 * @property {string} id
 * @property {string} name
 * @property {number} caloriesBurned
 * @property {number} duration
 * @property {string} date
 */

/**
 * @typedef {Object} ExercisesHook
 * @property {Exercise[]} exercises
 * @property {function(Omit<Exercise, 'id'>): Promise<void>} addExercise
 * @property {function(string): Promise<void>} deleteExercise
 * @property {boolean} loading
 * @property {string|null} error
 */

/**
 * @typedef {Object} Filter
 * @property {string} id
 * @property {string} name
 * @property {Object} criteria
 */

/**
 * @typedef {Object} FiltersHook
 * @property {Filter[]} filters
 * @property {function(Omit<Filter, 'id'>): void} addFilter
 * @property {function(string): void} removeFilter
 * @property {function(): void} clearFilters
 */

/**
 * @typedef {Object} ErrorHandler
 * @property {function(Error): void} handleError
 * @property {function(): void} clearError
 */
