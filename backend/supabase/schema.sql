-- backend/supabase/schema.sql

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT,
  email TEXT UNIQUE,
  firebase_uid TEXT UNIQUE,
  auth_provider TEXT DEFAULT 'firebase',
  user_type TEXT DEFAULT 'regular',
  role TEXT DEFAULT 'user',
  gender TEXT,
  age INTEGER,
  height NUMERIC,
  weight NUMERIC,
  activity_level TEXT DEFAULT 'moderately_active',
  fitness_goal TEXT DEFAULT 'get_fitter',
  is_onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diamonds table (user balance)
CREATE TABLE IF NOT EXISTS diamonds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 50, -- Assuming STARTING_BALANCE=50
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  calories INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  protein INTEGER NOT NULL,
  fats INTEGER NOT NULL,
  time TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Nutrition table
CREATE TABLE IF NOT EXISTS daily_nutrition (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  calories INTEGER DEFAULT 0,
  carbs INTEGER DEFAULT 0,
  protein INTEGER DEFAULT 0,
  fats INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Daily Nutrition to Meals junction table
CREATE TABLE IF NOT EXISTS daily_nutrition_meals (
  daily_nutrition_id UUID REFERENCES daily_nutrition(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  PRIMARY KEY (daily_nutrition_id, meal_id)
);

-- Progress table
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  weight NUMERIC,
  muscle_mass NUMERIC,
  fat_percentage NUMERIC,
  chest_measurement NUMERIC,
  waist_measurement NUMERIC,
  hips_measurement NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE diamonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view their own diamonds" ON diamonds
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own meals" ON meals
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own meals" ON meals
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own daily nutrition" ON daily_nutrition
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view their own progress" ON progress
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own progress" ON progress
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Function to add a meal and update daily nutrition in a single transaction
CREATE OR REPLACE FUNCTION add_meal_with_nutrition(
  p_user_id UUID,
  p_name TEXT,
  p_image TEXT,
  p_calories NUMERIC,
  p_carbs NUMERIC,
  p_protein NUMERIC,
  p_fats NUMERIC,
  p_time TIMESTAMPTZ,
  p_date DATE
) RETURNS JSONB AS $$
DECLARE
  v_meal_id UUID;
  v_daily_nutrition_id UUID;
  v_result JSONB;
BEGIN
  -- Create the new meal
  INSERT INTO meals (
    user_id, 
    name, 
    image, 
    calories, 
    carbs, 
    protein, 
    fats, 
    time, 
    date
  ) VALUES (
    p_user_id, 
    p_name, 
    p_image, 
    p_calories, 
    p_carbs, 
    p_protein, 
    p_fats, 
    p_time, 
    p_date
  ) RETURNING id INTO v_meal_id;
  
  -- Check if daily nutrition record exists for this date
  SELECT id INTO v_daily_nutrition_id 
  FROM daily_nutrition 
  WHERE user_id = p_user_id AND date = p_date;
  
  IF v_daily_nutrition_id IS NULL THEN
    -- Create new daily nutrition record
    INSERT INTO daily_nutrition (
      user_id, 
      date, 
      calories, 
      carbs, 
      protein, 
      fats
    ) VALUES (
      p_user_id, 
      p_date, 
      p_calories, 
      p_carbs, 
      p_protein, 
      p_fats
    ) RETURNING id INTO v_daily_nutrition_id;
  ELSE
    -- Update existing daily nutrition record
    UPDATE daily_nutrition 
    SET 
      calories = calories + p_calories,
      carbs = carbs + p_carbs,
      protein = protein + p_protein,
      fats = fats + p_fats,
      updated_at = NOW()
    WHERE id = v_daily_nutrition_id;
  END IF;
  
  -- Create relationship between meal and daily nutrition
  INSERT INTO daily_nutrition_meals (
    daily_nutrition_id, 
    meal_id
  ) VALUES (
    v_daily_nutrition_id, 
    v_meal_id
  );
  
  -- Return the meal ID
  SELECT jsonb_build_object(
    'id', v_meal_id,
    'daily_nutrition_id', v_daily_nutrition_id
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION add_meal_with_nutrition TO authenticated;
GRANT EXECUTE ON FUNCTION add_meal_with_nutrition TO service_role;
