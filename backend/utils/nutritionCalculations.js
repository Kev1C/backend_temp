// Utility functions for nutrition calculations

const calculateBMR = (gender, weight, height, age) => {
    // Mifflin-St Jeor Equation
    if (gender === 'male') {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
};

const getActivityMultiplier = (activityLevel) => {
    const multipliers = {
        'sedentary': 1.2,
        'lightly_active': 1.375,
        'moderately_active': 1.55,
        'very_active': 1.725
    };
    return multipliers[activityLevel] || 1.2;
};

const getAgeFromRange = (ageRange) => {
    const ranges = {
        '18-24': 21,
        '25-34': 29,
        '35-44': 39,
        '45-54': 49,
        '55-64': 59,
        '65+': 70
    };
    return ranges[ageRange] || 30;
};

const getGoalMultiplier = (goal) => {
    const multipliers = {
        'lose_weight': 0.8,
        'get_fitter': 1.0,
        'gain_muscle': 1.2
    };
    return multipliers[goal] || 1.0;
};

module.exports = {
    calculateBMR,
    getActivityMultiplier,
    getAgeFromRange,
    getGoalMultiplier
};
