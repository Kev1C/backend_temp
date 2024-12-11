import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FiltersHook, Filter } from '../types/hooks';

export const useFilters = (): FiltersHook => {
  const [filters, setFilters] = useState<Filter[]>([]);

  const addFilter = useCallback((filter: Omit<Filter, 'id'>) => {
    const newFilter: Filter = {
      ...filter,
      id: uuidv4(),
    };
    setFilters(prev => [...prev, newFilter]);
  }, []);

  const removeFilter = useCallback((id: string) => {
    setFilters(prev => prev.filter(filter => filter.id !== id));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  return {
    filters,
    addFilter,
    removeFilter,
    clearFilters,
  };
};

export default useFilters;
