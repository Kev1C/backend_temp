//frontend/screens/Home/MemoizedComponents.js
import React, { memo } from 'react';
import WeekCalendar from '../../Components/WeekCalendar';
import CalorieProgress from '../../Components/CalorieProgress';
import RecentlyEaten from '../../Components/RecentlyEaten';

export const MemoizedWeekCalendar = memo(WeekCalendar);
export const MemoizedCalorieProgress = memo(CalorieProgress);
export const MemoizedRecentlyEaten = memo(RecentlyEaten);
