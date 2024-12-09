// frontend/Components/ExerciseList.js

import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
// Removed default axios import
// import axios from 'axios';
import { api } from '../services/api'; // Import the centralized API instance

const ExerciseList = () => {
    const { authToken } = useContext(AuthContext);
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExercises = async () => {
            if (!authToken) {
                Alert.alert('Authentication Error', 'Please log in to view exercises.');
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/api/exercises', {
                    params: {
                        limit: 50, // Adjust as needed
                    },
                });
                setExercises(res.data);
            } catch (error) {
                // Errors are handled globally in api.js's response interceptor
                console.error('Error fetching exercises:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExercises();
    }, [authToken]);

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.image} />}
            <Text style={styles.title}>{item.name}</Text>
            <Text>{item.description}</Text>
            {item.videoUrl && <Text style={styles.link}>Video Tutorial: {item.videoUrl}</Text>}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <FlatList
            data={exercises}
            keyExtractor={(item) => item._id || item.id.toString()} // Fallback to index if _id is missing
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No exercises available.</Text>
                </View>
            }
            initialNumToRender={10} // Optimize rendering
            windowSize={21}
            getItemLayout={(data, index) => (
                { length: 250, offset: 250 * index, index }
            )}
        />
    );
};

const styles = StyleSheet.create({
    itemContainer: { 
        padding: 10, 
        borderBottomWidth: 1, 
        borderColor: '#ccc' 
    },
    image: { 
        width: '100%', 
        height: 200, 
        marginBottom: 10, 
        borderRadius: 10 
    },
    title: { 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
    link: { 
        color: 'blue', 
        marginTop: 5, 
        textDecorationLine: 'underline' 
    },
    loader: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    list: { 
        paddingBottom: 20 
    },
    emptyContainer: { 
        flex: 1, 
        alignItems: 'center', 
        marginTop: 50 
    },
    emptyText: { 
        fontSize: 16 
    },
});

export default ExerciseList;