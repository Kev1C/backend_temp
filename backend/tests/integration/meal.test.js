const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Meal = require('../../models/Meal');

describe('Meal Endpoints', () => {
  let token;
  let userId;

  beforeEach(async () => {
    // Create a test user and get token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'meal.test@example.com',
        password: 'Password123!',
        name: 'Meal Test User'
      });
    
    token = userResponse.body.token;
    userId = userResponse.body.user._id;
  });

  describe('POST /api/meals', () => {
    it('should create a new meal', async () => {
      const mealData = {
        name: 'Healthy Breakfast',
        foods: [
          { name: 'Oatmeal', calories: 150, protein: 6, carbs: 27, fat: 3 },
          { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.3 }
        ],
        totalCalories: 255,
        mealType: 'breakfast',
        date: new Date().toISOString()
      };

      const res = await request(app)
        .post('/api/meals')
        .set('Authorization', `Bearer ${token}`)
        .send(mealData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('name', mealData.name);
      expect(res.body.foods).toHaveLength(2);
    });

    it('should not create meal without authentication', async () => {
      const res = await request(app)
        .post('/api/meals')
        .send({
          name: 'Test Meal',
          foods: []
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/meals', () => {
    beforeEach(async () => {
      // Create some test meals
      await Meal.create([
        {
          user: userId,
          name: 'Breakfast',
          foods: [{ name: 'Eggs', calories: 140 }],
          totalCalories: 140,
          mealType: 'breakfast',
          date: new Date()
        },
        {
          user: userId,
          name: 'Lunch',
          foods: [{ name: 'Sandwich', calories: 350 }],
          totalCalories: 350,
          mealType: 'lunch',
          date: new Date()
        }
      ]);
    });

    it('should get all meals for user', async () => {
      const res = await request(app)
        .get('/api/meals')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(2);
    });

    it('should filter meals by date range', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const res = await request(app)
        .get('/api/meals')
        .set('Authorization', `Bearer ${token}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });
  });

  describe('DELETE /api/meals/:id', () => {
    let mealId;

    beforeEach(async () => {
      // Create a test meal
      const meal = await Meal.create({
        user: userId,
        name: 'Test Meal',
        foods: [{ name: 'Test Food', calories: 100 }],
        totalCalories: 100,
        mealType: 'snack',
        date: new Date()
      });
      mealId = meal._id;
    });

    it('should delete a meal', async () => {
      const res = await request(app)
        .delete(`/api/meals/${mealId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      
      // Verify meal is deleted
      const deletedMeal = await Meal.findById(mealId);
      expect(deletedMeal).toBeNull();
    });

    it('should not delete meal of another user', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'other.user@example.com',
          password: 'Password123!',
          name: 'Other User'
        });

      const res = await request(app)
        .delete(`/api/meals/${mealId}`)
        .set('Authorization', `Bearer ${otherUserResponse.body.token}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
