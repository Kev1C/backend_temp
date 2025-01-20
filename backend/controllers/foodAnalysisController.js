// backend/controllers/foodAnalysisController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const Diamond = require('../models/Diamond'); // Import Diamond model

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeFood = async (req, res) => {
    try {
        console.log('Received food analysis request');

        // Validate environment variables
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not found in environment variables');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }

        if (!req.body) {
            console.error('No request body received');
            return res.status(400).json({
                success: false,
                message: 'No request body provided'
            });
        }

        const { imageBase64 } = req.body;

        if (!imageBase64) {
            console.error('No image data in request');
            return res.status(400).json({
                success: false,
                message: 'No image data provided'
            });
        }

        // Check if the user has enough diamonds
        const userId = req.user.userId;
        const diamond = await Diamond.findOne({ user: userId }); // Find diamond balance
        const analysisCost = 150; // Example: Each analysis costs 5 diamonds

        if (!diamond || diamond.balance < analysisCost) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient diamonds to perform analysis', // Updated message
            });
        }
        // Deduct diamonds
        diamond.balance -= analysisCost;
        await diamond.save();

        console.log('Image size:', Math.round(imageBase64.length / 1024), 'KB');
        console.log('Image data received, analyzing with Gemini...');

        // Initialize the model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        // Prepare the image data
        const imageData = {
            inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg"
            }
        };

        // Create the prompt for food analysis
        const prompt = `Analyze this food image and provide the following information in a JSON format:
        1. Food name/title
        2. Estimated calories per serving
        3. Estimated macronutrients (carbs, protein, fats) in grams
        4. A health score from 0-100 based on nutritional value
        
        Format the response exactly like this example:
        {
            "foodTitle": "Food Name",
            "calories": "123",
            "carbs": "45",
            "protein": "67",
            "fats": "89",
            "healthScore": "75"
        }
        
        Only respond with the JSON, no other text.`;

        try {
            // Generate content
            const result = await model.generateContent([prompt, imageData]);
            const response = await result.response;
            const text = response.text();

            console.log('Raw response from Gemini:', text);

            // Enhanced cleaning of the response text
            let cleanedText = text
                .replace(/^```json\n?/, '')     // Remove starting ```json
                .replace(/^```\n?/, '')         // Remove starting ```
                .replace(/\n?```$/, '')         // Remove ending ```
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
                .trim();                        // Remove extra whitespace

            // Try to extract JSON if it's wrapped in other text
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanedText = jsonMatch[0];
            }

            console.log('Cleaned response text:', cleanedText);

            // Validate JSON structure before parsing
            if (!cleanedText.startsWith('{') || !cleanedText.endsWith('}')) {
                console.error('Invalid JSON structure. Raw text:', text);
                console.error('Cleaned text:', cleanedText);
                throw new Error('Invalid JSON structure in response');
            }

            // Parse the cleaned JSON response
            let nutritionData;
            try {
                nutritionData = JSON.parse(cleanedText);
            } catch (parseError) {
                console.error('JSON parsing error:', parseError);
                console.error('Problematic text:', cleanedText);

                // Attempt to fix common JSON issues
                cleanedText = cleanedText
                    .replace(/(['"'])?([a-zA-Z0-9_]+)(['"'])?\\s*:/g, '"$2": ') // Fix unquoted keys
                    .replace(/:\\s*'([^']*)']/g, ': "$1"')  // Replace single quotes with double quotes
                    .replace(/,\\s*}/g, '}');  // Remove trailing commas

                try {
                    nutritionData = JSON.parse(cleanedText);
                    console.log('Successfully parsed JSON after fixes');
                } catch (secondError) {
                    console.error('Failed to parse JSON even after fixes:', secondError);
                    throw new Error(`Failed to parse nutrition data: ${parseError.message}`);
                }
            }

            // Validate required fields
            const requiredFields = ['foodTitle', 'calories', 'carbs', 'protein', 'fats', 'healthScore'];
            const missingFields = requiredFields.filter(field => !nutritionData[field]);
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            console.log('Sending successful response:', nutritionData);
            res.status(200).json({
                success: true,
                ...nutritionData
            });

        } catch (geminiError) {
            console.error('Gemini API error:', geminiError);
            res.status(500).json({
                success: false,
                message: 'Error processing image with Gemini API',
                error: geminiError.message
            });
        }

    } catch (error) {
        console.error('Food analysis error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error analyzing food',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

module.exports = {
    analyzeFood
};