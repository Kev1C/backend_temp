// backend/config/db.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabaseClient = null;

const connectDB = async () => {
  if (supabaseClient) {
    console.log("=> using existing Supabase connection");
    return supabaseClient;
  }

  try {
    console.log("Supabase URL available:", !!process.env.SUPABASE_URL);
    console.log("Supabase Key available:", !!process.env.SUPABASE_SERVICE_KEY);

    supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          persistSession: false,
        }
      }
    );

    // Test connection
    const { data, error } = await supabaseClient.from('users').select('id').limit(1);
    
    if (error) throw new Error(`Connection test failed: ${error.message}`);
    
    console.log("Supabase Connected");
    return supabaseClient;
  } catch (error) {
    console.error(`Error connecting to Supabase: ${error.message}`);
    // Log the error but don't throw it to prevent function initialization failure
    return null;
  }
};

module.exports = connectDB;
