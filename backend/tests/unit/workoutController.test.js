const {
  createWorkout,
  getWorkouts,
  updateWorkout
} = require('../../controllers/workoutsController');
const Workout = require('../../models/Workout');
const mongoose = require('mongoose');

// Mock the Workout model
jest.mock('../../models/Workout');

describe('Workout Controller', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      user: { _id: new mongoose.Types.ObjectId() },
      body: {},
      params: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkout', () => {
    const workoutData = {
      name: 'Test Workout',
      exercises: [
        { name: 'Push-ups', sets: 3, reps: 10 }
      ],
      duration: 30,
      date: new Date()
    };

    it('should create a workout successfully', async () => {
      mockReq.body = workoutData;
      Workout.create.mockResolvedValue({ ...workoutData, _id: 'workout123' });

      await createWorkout(mockReq, mockRes, mockNext);

      expect(Workout.create).toHaveBeenCalledWith({
        ...workoutData,
        user: mockReq.user._id
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockReq.body = { name: 'Invalid Workout' }; // Missing required fields
      const error = new mongoose.Error.ValidationError();
      Workout.create.mockRejectedValue(error);

      await createWorkout(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getWorkouts', () => {
    it('should get workouts with pagination', async () => {
      mockReq.query = { page: 1, limit: 10 };
      const workouts = [
        { _id: 'workout1', name: 'Morning Workout' },
        { _id: 'workout2', name: 'Evening Workout' }
      ];

      Workout.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(workouts)
      });

      Workout.countDocuments.mockResolvedValue(2);

      await getWorkouts(mockReq, mockRes, mockNext);

      expect(Workout.find).toHaveBeenCalledWith({ user: mockReq.user._id });
      expect(mockRes.json).toHaveBeenCalledWith({
        workouts,
        currentPage: 1,
        totalPages: 1,
        totalWorkouts: 2
      });
    });

    it('should handle invalid pagination parameters', async () => {
      mockReq.query = { page: -1, limit: 0 };

      await getWorkouts(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateWorkout', () => {
    const workoutId = new mongoose.Types.ObjectId();
    const updateData = {
      name: 'Updated Workout',
      exercises: [
        { name: 'New Exercise', sets: 4, reps: 12 }
      ]
    };

    it('should update workout successfully', async () => {
      mockReq.params.id = workoutId;
      mockReq.body = updateData;

      Workout.findOneAndUpdate.mockResolvedValue({
        ...updateData,
        _id: workoutId
      });

      await updateWorkout(mockReq, mockRes, mockNext);

      expect(Workout.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: workoutId, user: mockReq.user._id },
        updateData,
        { new: true }
      );
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle workout not found', async () => {
      mockReq.params.id = workoutId;
      mockReq.body = updateData;

      Workout.findOneAndUpdate.mockResolvedValue(null);

      await updateWorkout(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle invalid workout ID', async () => {
      mockReq.params.id = 'invalid-id';
      mockReq.body = updateData;

      await updateWorkout(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});
