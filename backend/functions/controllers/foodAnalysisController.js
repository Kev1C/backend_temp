// backend/controllers/foodAnalysisController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const Diamond = require("../models/Diamond");
const Transaction = require("../models/Transactions");
const asyncHandler = require("express-async-handler");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeFood = asyncHandler(async (req, res) => {
  console.log("Received food analysis request");

  // Validate environment variables
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not found in environment variables");
    return res.status(500).json({
      success: false,
      message: "Server configuration error",
    });
  }

  if (!req.body) {
    console.error("No request body received");
    return res.status(400).json({
      success: false,
      message: "No request body provided",
    });
  }

  const { imageBase64 } = req.body;

  if (!imageBase64) {
    console.error("No image data in request");
    return res.status(400).json({
      success: false,
      message: "No image data provided",
    });
  }

  // **Diamond Deduction Logic**
  const userId = req.user.userId;
  const analysisCost = parseInt(process.env.ANALYSIS_COST, 10);

  // Get diamond balance using the updated Diamond model
  const diamond = await Diamond.findByUser(userId);
  if (!diamond) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (diamond.balance < analysisCost) {
    return res.status(400).json({
      success: false,
      message: "Insufficient diamonds to perform analysis",
    });
  }

  // Deduct diamonds and update balance
  const newBalance = diamond.balance - analysisCost;
  await Diamond.updateBalance(userId, newBalance);

  // Create a transaction record using the updated Transaction model
  await Transaction.create({
    user: userId,
    type: "SPEND",
    amount: analysisCost,
    description: "Deducted diamonds for food analysis",
    balanceAfter: newBalance,
  });

  console.log("Image size:", Math.round(imageBase64.length / 1024), "KB");
  console.log("Image data received, analyzing with Gemini...");

  // Initialize the model
  const model = genAI.getGenerativeModel({model: "gemini-2.0-flash-thinking-exp-01-21"});

  // Prepare the image data
  const imageData = {
    inlineData: {
      data: imageBase64,
      mimeType: "image/jpeg",
    },
  };

  // **Enhanced Prompt for Food Analysis**
  const prompt = `You are a highly advanced AI nutritionist. Analyze the food item(s) in this image with extreme precision.

    Consider these factors:
    1. **Visual Identification:** Identify every food item visible in the image. Be as specific as possible (e.g., "grilled salmon fillet" instead of "fish"). If you see packaging try and extract relevant information.
    2. **Portion Size:** Estimate the portion size of each food item, taking into account the typical serving size and the visual cues in the image. If the item is packaged provide the portion size on the package.
    3. **Preparation Method:** Infer the likely cooking or preparation method (e.g., fried, baked, raw, steamed).
    4. **Ingredients:** If multiple ingredients are discernible, list them.
    5. **Nutritional Database Comparison:**  Based on your identification, portion estimation, and preparation method, cross-reference with extensive nutritional databases to provide the most accurate values.

    Provide the following information in a JSON format:
    1. **foodTitle:**  The most accurate and descriptive name of the food item(s).
    2. **calories:** Estimated total calories for the portion shown.
    3. **carbs:** Estimated total carbohydrates in grams for the portion shown.
    4. **protein:** Estimated total protein in grams for the portion shown.
    5. **fats:** Estimated total fats in grams for the portion shown.
    6. **healthScore:** An overall health score from 0-100, where 0 is extremely unhealthy and 100 is extremely healthy. This score should consider the nutritional balance, presence of beneficial nutrients, and potential downsides (e.g., high saturated fat, processed ingredients). If the item is packaged base this score on the nutritional label.

    **Example of ideal response (for a single, identifiable food item):**
    \`\`\`json
    {
        "foodTitle": "Grilled Salmon with Asparagus and Quinoa",
        "calories": "450",
        "carbs": "30",
        "protein": "40",
        "fats": "20",
        "healthScore": "85"
    }
    \`\`\`
    
    **Example of ideal response (for a packaged food item):**
    \`\`\`json
    {
        "foodTitle": "Kellogg's Special K Cereal",
        "calories": "120",
        "carbs": "24",
        "protein": "6",
        "fats": "1",
        "healthScore": "65"
    }
    \`\`\`

    **Important:**
    *   Respond with the JSON **and nothing else**.
    *   **Do not** add any conversational text before or after the JSON.
    *   If you are unsure about an aspect, provide your best estimate based on available information and consider indicating the uncertainty in your reasoning (though not in the final JSON output).
    *   If the image contains multiple food items, provide an analysis for the most prominent or central item.
    *   Assume the photo was taken with a standard phone camera.
  `;

  try {
    // Generate content using Gemini
    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();

    console.log("Raw response from Gemini:", text);

    // Enhanced cleaning of the response text
    let cleanedText = text
        .replace(/^```json\n?/, "") // Remove starting ```json
        .replace(/^```\n?/, "") // Remove starting ```
        .replace(/\n?```$/, "") // Remove ending ```
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
        .trim(); // Remove extra whitespace

    // Try to extract JSON if it's wrapped in other text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    console.log("Cleaned response text:", cleanedText);

    // Validate JSON structure before parsing
    if (!cleanedText.startsWith("{") || !cleanedText.endsWith("}")) {
      console.error("Invalid JSON structure. Raw text:", text);
      console.error("Cleaned text:", cleanedText);
      throw new Error("Invalid JSON structure in response");
    }

    // Parse the cleaned JSON response
    let nutritionData;
    try {
      nutritionData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Problematic text:", cleanedText);

      // Attempt to fix common JSON issues
      cleanedText = cleanedText
          .replace(/(['"'])?([a-zA-Z0-9_]+)(['"'])?\\s*:/g, "\"$2\": ") // Fix unquoted keys
          .replace(/:\\s*'([^']*)']/g, ": \"$1\"") // Replace single quotes with double quotes
          .replace(/,\\s*}/g, "}"); // Remove trailing commas

      try {
        nutritionData = JSON.parse(cleanedText);
        console.log("Successfully parsed JSON after fixes");
      } catch (secondError) {
        console.error("Failed to parse JSON even after fixes:", secondError);
        throw new Error(`Failed to parse nutrition data: ${parseError.message}`);
      }
    }

    // Validate required fields
    const requiredFields = ["foodTitle", "calories", "carbs", "protein", "fats", "healthScore"];
    const missingFields = requiredFields.filter((field) => !nutritionData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    console.log("Sending successful response:", nutritionData);
    res.status(200).json({
      success: true,
      ...nutritionData,
    });
  } catch (geminiError) {
    console.error("Gemini API error:", geminiError);
    res.status(500).json({
      success: false,
      message: "Error processing image with Gemini API",
      error: geminiError.message,
    });
  }
});

module.exports = {
  analyzeFood,
};
