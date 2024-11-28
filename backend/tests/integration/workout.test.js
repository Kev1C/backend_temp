const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Workout = require('../../models/Workout');

describe('Workout Endpoints', () => {
  let token;
  let userId;

  beforeEach(async () => {
    // Create a test user and get token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'workout.test@example.com',
        password: 'Password123!',
        name: 'Workout Test User'
      });
    
    token = userResponse.body.token;
    userId = userResponse.body.user._id;
  });

  describe('POST /api/workouts', () => {
    it('should create a new workout', async () => {
      const workoutData = {
        name: 'Full Body Workout',
        exercises: [
          {
            name: 'Push-ups',
            sets: 3,
            reps: 12,
            weight: 0
          },
          {
            name: 'Squats',
            sets: 4,
            reps: 10,
            weight: 135
          }
        ],
        duration: 45,
        date: new Date().toISOString()
      };

      const res = await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${token}`)
        .send(workoutData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('name', workoutData.name);
      expect(res.body.exercises).toHaveLength(2);
    });

    it('should validate required workout fields', async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Invalid Workout'
          // Missing required fields
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/workouts', () => {
    beforeEach(async () => {
      // Create test workouts
      await Workout.create([
        {
          user: userId,
          name: 'Morning Workout',
          exercises: [{ name: 'Push-ups', sets: 3, reps: 10 }],
          duration: 30,
          date: new Date()
        },
        {
          user: userId,
          name: 'Evening Workout',
          exercises: [{ name: 'Pull-ups', sets: 3, reps: 8 }],
          duration: 25,
          date: new Date()
        }
      ]);
    });

    it('should get all workouts for user', async () => {
      const res = await request(app)
        .get('/api/workouts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(2);
    });

    it('should get workouts with pagination', async () => {
      const res = await request(app)
        .get('/api/workouts')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 1 });

      expect(res.statusCode).toBe(200);
      expect(res.body.workouts).toBeInstanceOf(Array);
      expect(res.body.workouts).toHaveLength(1);
      expect(res.body).toHaveProperty('totalPages');
    });
  });

  describe('PUT /api/workouts/:id', () => {
    let workoutId;

    beforeEach(async () => {
      // Create a test workout
      const workout = await Workout.create({
        user: userId,
        name: 'Test Workout',
        exercises: [{ name: 'Test Exercise', sets: 3, reps: 10 }],
        duration: 30,
        date: new Date()
      });
      workoutId = workout._id;
    });

    it('should update a workout', async () => {
      const updateData = {
        name: 'Updated Workout',
        exercises: [
          { name: 'New Exercise', sets: 4, reps: 12 }
        ]
      };

      const res = await request(app)
        .put(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', updateData.name);
      expect(res.body.exercises[0].name).toBe(updateData.exercises[0].name);
    });

    it('should not update workout of another user', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'other.workout@example.com',
          password: 'Password123!',
          name: 'Other User'
        });

      const res = await request(app)
        .put(`/api/workouts/${workoutId}`)
        .set('Authorization', `Bearer ${otherUserResponse.body.token}`)
        .send({ name: 'Hacked Workout' });

      expect(res.statusCode).toBe(403);
    });
  });
});
