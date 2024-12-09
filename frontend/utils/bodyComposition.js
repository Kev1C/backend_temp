// Utility functions for body composition calculations using the Hume formula

/**
 * Calculate lean body mass using the Hume formula
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @param {string} gender - 'male' or 'female'
 * @returns {number} Lean body mass in kg
 */
export const calculateLeanBodyMass = (weight, height, gender) => {
  if (!weight || !height || !gender) return null;

  // Hume formula coefficients
  const coefficients = {
    male: {
      weight: 0.32810,
      height: 0.33929,
      constant: -29.5336
    },
    female: {
      weight: 0.29569,
      height: 0.41813,
      constant: -43.2933
    }
  };

  const coef = coefficients[gender.toLowerCase()];
  if (!coef) return null;

  // Calculate estimated lean body mass (eLBM) using Hume formula
  const eLBM = (coef.weight * weight) + (coef.height * height) + coef.constant;
  
  // Round to 1 decimal place
  return Math.round(eLBM * 10) / 10;
};

/**
 * Calculate body fat percentage based on total weight and lean body mass
 * @param {number} weight - Total weight in kg
 * @param {number} leanBodyMass - Lean body mass in kg
 * @returns {number} Body fat percentage
 */
export const calculateBodyFat = (weight, leanBodyMass) => {
  if (!weight || !leanBodyMass) return null;

  // Body fat mass = Total weight - Lean body mass
  const fatMass = weight - leanBodyMass;
  
  // Body fat percentage = (Fat mass / Total weight) * 100
  const bodyFatPercentage = (fatMass / weight) * 100;
  
  // Round to 1 decimal place and ensure it's within reasonable bounds
  return Math.min(Math.max(Math.round(bodyFatPercentage * 10) / 10, 5), 50);
};

/**
 * Calculate muscle mass based on lean body mass
 * @param {number} leanBodyMass - Lean body mass in kg
 * @returns {number} Muscle mass in kg
 */
export const calculateMuscleMass = (leanBodyMass) => {
  if (!leanBodyMass) return null;

  // Muscle mass is approximately 75% of lean body mass
  const muscleMass = leanBodyMass * 0.75;
  
  // Round to 1 decimal place
  return Math.round(muscleMass * 10) / 10;
};
