// backend/services/exerciseService.js

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Fuse = require('fuse.js');
const mongoose = require('mongoose');
const Exercise = require('../models/Exercise'); // Adjust the path as necessary

class ExerciseService {
    constructor() {
        this.exercises = [];
        this.fuse = null;
        this.loadExercises();
    }

    /**
     * Loads exercises from a CSV file and initializes the Fuse.js search index.
     */
    loadExercises() {
        const filePath = path.resolve(__dirname, './Exercises.csv');

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Exercises.csv file not found at path:', filePath);
                return;
            }

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    try {
                        // Parse gender URLs
                        const maleUrl = row.Male ? row.Male.trim() : '';
                        const femaleUrl = row.Female ? row.Female.trim() : '';

                        // Validate URLs using a simple regex
                        const urlRegex = /^https?:\/\/.+\..+$/;

                        const isValidMaleUrl = maleUrl === '' || urlRegex.test(maleUrl);
                        const isValidFemaleUrl = femaleUrl === '' || urlRegex.test(femaleUrl);

                        if (!isValidMaleUrl) {
                            console.warn(`Invalid Male URL for exercise "${row.Exercise}": ${maleUrl}`);
                        }

                        if (!isValidFemaleUrl) {
                            console.warn(`Invalid Female URL for exercise "${row.Exercise}": ${femaleUrl}`);
                        }

                        // Clean and parse muscles
                        const muscles = row.Muscle.split(',').map(m => m.trim().toLowerCase());

                        // Clean and parse equipment, excluding any non-equipment terms
                        const equipmentRaw = row.Equipment.split(',').map(e => e.trim().toLowerCase());
                        const validEquipment = ['barbell', 'dumbbell', 'kettlebell', 'machine', 'bodyweight', 'band', 'plate', 'other'];
                        const equipment = equipmentRaw.filter(e => validEquipment.includes(e));

                        // Parse difficulty
                        const difficulty = row.Difficulty.trim().toLowerCase();
                        const validDifficulties = ['novice','beginner', 'intermediate', 'advanced'];
                        if (!validDifficulties.includes(difficulty)) {
                            console.warn(`Invalid difficulty "${difficulty}" for exercise "${row.Exercise}". Defaulting to "novice".`);
                        }

                        // Optional fields with fallback
                        const description = row.Description ? row.Description.trim() : '';
                        const imageUrl = row.ImageURL ? row.ImageURL.trim() : '';
                        const videoUrl = row.VideoURL ? row.VideoURL.trim() : '';

                        // Create exercise object
                        const exercise = {
                            name: row.Exercise.trim(),
                            muscles,
                            equipment,
                            difficulty: validDifficulties.includes(difficulty) ? difficulty : 'novice',
                            gender: {
                                maleUrl: isValidMaleUrl ? maleUrl : '',
                                femaleUrl: isValidFemaleUrl ? femaleUrl : '',
                            },
                            description,
                            imageUrl,
                            videoUrl,
                        };

                        this.exercises.push(exercise);
                    } catch (parseError) {
                        console.error('Error parsing row:', row, 'Error:', parseError);
                    }
                })
                .on('end', () => {
                    console.log(`Loaded ${this.exercises.length} exercises from CSV.`);
                    this.saveExercisesToDB();
                })
                .on('error', (err) => {
                    console.error('Error reading Exercises.csv:', err);
                });
        });
    }

    /**
     * Saves parsed exercises to the MongoDB database.
     */
    async saveExercisesToDB() {
        try {
            // Connect to MongoDB if not already connected
            if (mongoose.connection.readyState === 0) {
                await mongoose.connect('mongodb://localhost:27017/your_database', { // Replace with your actual MongoDB URI
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                });
                console.log('Connected to MongoDB.');
            }

            // Clear existing exercises to avoid duplicates. Comment out if you don't want this behavior.
            // await Exercise.deleteMany({});
            // console.log('Cleared existing exercises.');

            // Insert exercises
            const insertResult = await Exercise.insertMany(this.exercises, { ordered: false });
            console.log(`Inserted ${insertResult.length} exercises into the database.`);

            // Build Fuse.js after successful insertion
            this.buildFuse();
        } catch (error) {
            if (error.name === 'BulkWriteError') {
                console.error('Some exercises failed to insert:', error.writeErrors);
            } else {
                console.error('Error saving exercises to DB:', error);
            }
        }
    }

    /**
     * Builds the Fuse.js search index for efficient searching.
     */
    buildFuse() {
        if (this.exercises.length === 0) {
            console.warn('No exercises available to build the search index.');
            return;
        }

        const options = {
            keys: ['name', 'muscles', 'equipment', 'description'],
            threshold: 0.3, // Adjust based on desired fuzziness
            includeScore: true,
        };
        this.fuse = new Fuse(this.exercises, options);
        console.log('Fuse.js search index built.');
    }

    /**
     * Searches exercises based on provided filters.
     * @param {object} filters - Search filters.
     * @param {string} filters.search - Search query.
     * @param {string} filters.muscle - Muscle groups.
     * @param {string} filters.equipment - Equipment types.
     * @param {string} filters.difficulty - Difficulty level.
     * @param {string} filters.gender - Gender preference.
     * @param {number} [filters.limit=20] - Maximum number of results.
     * @returns {Array} - Filtered list of exercises.
     */
    searchExercises({ search, muscle, equipment, difficulty, gender, limit = 20 }) {
        let results = this.exercises;

        // Search using Fuse.js
        if (search && this.fuse) {
            const fuseResults = this.fuse.search(search);
            results = fuseResults.map(result => result.item);
        }

        // Filter by muscle
        if (muscle) {
            const muscles = muscle.split(',').map(m => m.trim().toLowerCase());
            results = results.filter(ex => ex.muscles.some(m => muscles.includes(m)));
        }

        // Filter by equipment
        if (equipment) {
            const equipments = equipment.split(',').map(e => e.trim().toLowerCase());
            results = results.filter(ex => ex.equipment.some(e => equipments.includes(e)));
        }

        // Filter by difficulty
        if (difficulty) {
            const difficultyLower = difficulty.trim().toLowerCase();
            const validDifficulties = ['novice','beginner', 'intermediate', 'advanced'];
            if (validDifficulties.includes(difficultyLower)) {
                results = results.filter(ex => ex.difficulty === difficultyLower);
            }
        }
        // Limit the results
        const finalResults = results.slice(0, limit);
        return finalResults;
    }
}

module.exports = new ExerciseService();