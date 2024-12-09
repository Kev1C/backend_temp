// frontend/hooks/useFilters.js

import { useState } from 'react';

const useFilters = () => {
    const [selectedMuscles, setSelectedMuscles] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState('');

    const handleSelectedMusclesChange = (items) => {
        setSelectedMuscles(Array.isArray(items) ? items : []);
    };

    const handleSelectedEquipmentChange = (items) => {
        setSelectedEquipment(Array.isArray(items) ? items : []);
    };

    const resetFilters = () => {
        setSelectedMuscles([]);
        setSelectedEquipment([]);
        setSelectedDifficulty('');
    };

    return {
        selectedMuscles,
        selectedEquipment,
        selectedDifficulty,
        handleSelectedMusclesChange,
        handleSelectedEquipmentChange,
        setSelectedDifficulty,
        resetFilters,
    };
};

export default useFilters;