// colorUtils.js
export const getCategoryColor = (category, value, theme) => {
    const colorSchemes = {
      Cardio: [
        { threshold: 20, color: '#AEDFF7' },
        { threshold: 40, color: '#5CB1F6' },
        { threshold: Infinity, color: '#2A6EBB' }
      ],
      StrengthTraining: [
        { threshold: 100, color: '#C2FFD8' },
        { threshold: 200, color: '#6EE7B7' },
        { threshold: Infinity, color: '#118D6E' }
      ],
      Flexibility: [
        { threshold: 20, color: '#D7B0E0' },
        { threshold: 40, color: '#A569BD' },
        { threshold: Infinity, color: '#6A1B9A' }
      ]
    };
  
    const scheme = colorSchemes[category] || [];
    return scheme.find(s => value <= s.threshold)?.color || theme.colors.disabled;
  };