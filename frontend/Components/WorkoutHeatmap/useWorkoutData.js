// useWorkoutData.js
import { useState, useEffect } from 'react';
import api from '../../services/api'; // Adjust the import path as needed

export const useWorkoutData = (user, currentMonth, selectedCategories, selectedMuscleGroup) => {
  const [workoutData, setWorkoutData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!user) {
        setWorkoutData({});
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = {
          userId: user.id,
          month: currentMonth.format('YYYY-MM'),
          categories: selectedCategories.join(','),
          ...(selectedMuscleGroup !== 'All' && { muscleGroup: selectedMuscleGroup }),
        };

        const response = await api.get('/workouts', { params });
        setWorkoutData(response.data);
      } catch (error) {
        console.error('Error fetching workout data:', error);
        setError('Failed to fetch workout data. Please try again later.');
        setWorkoutData({});
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutData();
  }, [user, currentMonth, selectedCategories, selectedMuscleGroup]);

  return { workoutData, loading, error };
};