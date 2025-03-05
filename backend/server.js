// backend/server.js
const app = require('./functions/app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: Supabase (${process.env.SUPABASE_URL ? 'URL configured' : 'URL missing'})`);
});
