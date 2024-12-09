import moment from 'moment';

export const generateMockNutritionData = () => {
  // Generate last 7 days of macro data
  const generateMacroData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days').format('MMM D');
      days.push({
        date,
        protein: Math.floor(Math.random() * 30) + 40, // 40-70g protein
        carbs: Math.floor(Math.random() * 50) + 150,  // 150-200g carbs
        fat: Math.floor(Math.random() * 20) + 40,     // 40-60g fat
      });
    }
    return days;
  };

  // Generate last 30 days of calendar data
  const generateCalendarData = () => {
    const calendarData = {};
    for (let i = 29; i >= 0; i--) {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
      calendarData[date] = {
        value: Math.floor(Math.random() * 1000) + 1500, // 1500-2500 calories
      };
    }
    return calendarData;
  };

  return {
    macroData: {
      labels: generateMacroData().map(day => day.date),
      datasets: [
        {
          data: generateMacroData().map(day => day.protein),
          color: '#4285F4', // Blue for protein
          name: 'Protein'
        },
        {
          data: generateMacroData().map(day => day.carbs),
          color: '#34A853', // Green for carbs
          name: 'Carbs'
        },
        {
          data: generateMacroData().map(day => day.fat),
          color: '#FBBC04', // Yellow for fat
          name: 'Fat'
        },
      ]
    },
    calendarData: generateCalendarData(),
  };
};
