import { createClient } from 'npm:@supabase/supabase-js';

// Note: No need for dotenv in Deno/Edge Functions as it has built-in env support

let supabaseClient = null;

const connectDB = async () => {
  if (supabaseClient) {
    console.log("=> using existing Supabase connection");
    return supabaseClient;
  }

  try {
    console.log("Supabase URL available:", !!Deno.env.get("SUPABASE_URL"));
    console.log("Supabase Key available:", !!Deno.env.get("SUPABASE_SERVICE_KEY"));

    supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_KEY") || "",
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

export default connectDB;
