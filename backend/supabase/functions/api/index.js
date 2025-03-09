// Import your Express app - use relative import for local files, not npm: prefix
import app from './app.js';

// Define the server handler
Deno.serve(async (req) => {
  // Pass the request to the Express app
  return await app(req);
});

/* To invoke locally:
 * 1. Run `supabase start`
 * 2. Make HTTP requests to http://127.0.0.1:54321/functions/v1/api
 */
