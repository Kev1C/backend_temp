const { 
  createMeal,
  getMeals,
  deleteMeal
} = require('../../controllers/mealController');
const Meal = require('../../models/Meal');
const mongoose = require('mongoose');

// Mock the Meal model
jest.mock('../../models/Meal');

describe('Meal Controller', () => {
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

  describe('createMeal', () => {
    const mealData = {
      name: 'Test Meal',
      foods: [{ name: 'Test Food', calories: 100 }],
      totalCalories: 100,
      mealType: 'lunch',
      date: new Date()
    };

    it('should create a meal successfully', async () => {
      mockReq.body = mealData;
      Meal.create.mockResolvedValue({ ...mealData, _id: 'meal123' });

      await createMeal(mockReq, mockRes, mockNext);

      expect(Meal.create).toHaveBeenCalledWith({
        ...mealData,
        user: mockReq.user._id
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockReq.body = { name: 'Invalid Meal' }; // Missing required fields
      const error = new mongoose.Error.ValidationError();
      Meal.create.mockRejectedValue(error);

      await createMeal(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getMeals', () => {
    it('should get meals for user', async () => {
      const meals = [
        { _id: 'meal1', name: 'Breakfast' },
        { _id: 'meal2', name: 'Lunch' }
      ];
      
      Meal.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(meals)
      });

      await getMeals(mockReq, mockRes, mockNext);

      expect(Meal.find).toHaveBeenCalledWith({ user: mockReq.user._id });
      expect(mockRes.json).toHaveBeenCalledWith(meals);
    });

    it('should handle date range filters', async () => {
      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-02'
      };

      const meals = [{ _id: 'meal1', name: 'Breakfast' }];
      
      Meal.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(meals)
      });

      await getMeals(mockReq, mockRes, mockNext);

      expect(Meal.find).toHaveBeenCalledWith({
        user: mockReq.user._id,
        date: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-01-02')
        }
      });
    });
  });

  describe('deleteMeal', () => {
    it('should delete meal successfully', async () => {
      const mealId = new mongoose.Types.ObjectId();
      mockReq.params.id = mealId;

      Meal.findOneAndDelete.mockResolvedValue({ _id: mealId });

      await deleteMeal(mockReq, mockRes, mockNext);

      expect(Meal.findOneAndDelete).toHaveBeenCalledWith({
        _id: mealId,
        user: mockReq.user._id
      });
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle meal not found', async () => {
      mockReq.params.id = new mongoose.Types.ObjectId();
      Meal.findOneAndDelete.mockResolvedValue(null);

      await deleteMeal(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});
