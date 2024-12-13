// frontend/screens/Home/ExercisesScreen.js

import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Linking,
    Alert,
} from 'react-native';
import { useTheme, Button } from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import useExercises from '../../hooks/useExercises';
import useFilters from '../../hooks/useFilters';
import ExerciseItem from '../../Components/ExerciseItem';
import FilterModal from '../../Components/FilterModal';
import DetailModal from '../../Components/DetailModal';
import SearchHeader from '../../Components/SearchHeader';
import { MUSCLE_OPTIONS, EQUIPMENT_OPTIONS, DIFFICULTY_OPTIONS } from './constants';
import createStyles from './ExercisesScreenStyles';
import globalStyles from './globalStyles';

const ExercisesScreen = () => {
    const { authToken } = useAuthStore();
    const theme = useTheme();
    const styles = useMemo(() => ({
        ...globalStyles,
        ...createStyles(theme)
    }), [theme]);

    const {
        selectedMuscles,
        selectedEquipment,
        selectedDifficulty,
        handleSelectedMusclesChange,
        handleSelectedEquipmentChange,
        setSelectedDifficulty,
        resetFilters,
    } = useFilters();

    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const {
        exercises,
        loading,
        isRefreshing,
        onRefresh,
        error,
    } = useExercises(authToken, searchQuery, {
        muscles: selectedMuscles.join(','),
        equipment: selectedEquipment.join(','),
        difficulty: selectedDifficulty,
    });

    const sanitizeInput = useCallback((input) => {
        return input.replace(/[^\w\s]/gi, '');
    }, []);

    const handleSearch = useCallback((text) => {
        setSearchQuery(sanitizeInput(text));
    }, [sanitizeInput]);

    const openFilterModal = useCallback(() => setFilterModalVisible(true), []);
    const closeFilterModal = useCallback(() => setFilterModalVisible(false), []);

    const handleOpenURL = useCallback(async (url) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Invalid URL', 'Cannot open the requested URL.');
            }
        } catch (error) {
            console.error('An error occurred', error);
            Alert.alert('Error', 'An error occurred while trying to open the URL.');
        }
    }, []);

    const openDetailModal = useCallback((exercise) => {
        setSelectedExercise(exercise);
        setDetailModalVisible(true);
    }, []);

    const closeDetailModal = useCallback(() => {
        setDetailModalVisible(false);
        setSelectedExercise(null);
    }, []);

    const renderExerciseItem = useCallback(({ item }) => (
        <ExerciseItem
            item={item}
            onPress={openDetailModal}
            onOpenURL={handleOpenURL}
        />
    ), [openDetailModal, handleOpenURL]);

    if (loading && exercises.length === 0) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.colors.error }]}>Error: {error}</Text>
                <Text style={styles.errorSubText}>Please try refreshing or check your connection.</Text>
                <Button mode="contained" onPress={onRefresh} color={theme.colors.primary}>
                    Retry
                </Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SearchHeader
                searchQuery={searchQuery}
                onSearch={handleSearch}
                onOpenFilter={openFilterModal}
            />

            <FilterModal
                visible={filterModalVisible}
                onClose={closeFilterModal}
                muscleOptions={MUSCLE_OPTIONS}
                equipmentOptions={EQUIPMENT_OPTIONS}
                difficultyOptions={DIFFICULTY_OPTIONS}
                selectedMuscles={selectedMuscles}
                selectedEquipment={selectedEquipment}
                selectedDifficulty={selectedDifficulty}
                onMusclesChange={handleSelectedMusclesChange}
                onEquipmentChange={handleSelectedEquipmentChange}
                onDifficultyChange={setSelectedDifficulty}
                onReset={resetFilters}
            />

            <DetailModal
                visible={detailModalVisible}
                onClose={closeDetailModal}
                exercise={selectedExercise}
                onOpenURL={handleOpenURL}
            />

            <FlatList
                data={exercises}
                keyExtractor={(item) => item._id.toString()}
                renderItem={renderExerciseItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary, theme.colors.accent]}
                        progressBackgroundColor={theme.colors.surface}
                    />
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No exercises found.</Text>
                        </View>
                    )
                }
                initialNumToRender={10}
                maxToRenderPerBatch={20}
                windowSize={21}
                removeClippedSubviews={true}
            />
        </View>
    );
};

export default ExercisesScreen;