// frontend/types/store.js

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} [email]
 * @property {string} [displayName]
 * @property {boolean} [isGuest]
 * @property {UserPreferences} [preferences]
 * @property {UserGoals} [goals]
 */

/**
 * @typedef {Object} UserPreferences
 * @property {'light' | 'dark'} theme
 * @property {'metric' | 'imperial'} measurementUnit
 * @property {boolean} notifications
 */

/**
 * @typedef {Object} UserGoals
 * @property {number} calories
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 */

/**
 * @typedef {Object} DailyNutrition
 * @property {string} date
 * @property {number} calories
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {Meal[]} meals
 * @property {number} water
 */

/**
 * @typedef {Object} Meal
 * @property {string} id
 * @property {string} name
 * @property {number} calories
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {number} servingSize
 * @property {string} servingUnit
 * @property {string} timeConsumed
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user
 * @property {string|null} authToken
 * @property {string|null} firebaseToken
 * @property {boolean} loading
 */

/**
 * @typedef {Object} NutritionState
 * @property {DailyNutrition|null} dailyNutrition
 * @property {boolean} isLoading
 * @property {string|null} error
 * @property {Map<string, DailyNutrition>} cache
 * @property {Map<string, number>} lastFetch
 * @property {function(Date, boolean=): Promise<DailyNutrition>} fetchDailyNutrition
 * @property {function(Date, Object): Promise<DailyNutrition>} updateDailyNutrition
 * @property {function(): void} clearCache
 */

/**
 * @typedef {Object} CacheState
 * @property {Map<string, any>} data
 * @property {Map<string, number>} lastFetch
 * @property {function(string): any} get
 * @property {function(string, any, number=): void} set
 * @property {function(string): void} invalidate
 * @property {function(): void} clearAll
 */
