const User = require('../../models/User');
const mongoose = require('mongoose');

describe('User Model Test', () => {
  it('should create & save user successfully', async () => {
    const validUser = new User({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'Password123!'
    });
    const savedUser = await validUser.save();
    
    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe(validUser.email);
    expect(savedUser.name).toBe(validUser.name);
    // Password should be hashed
    expect(savedUser.password).not.toBe('Password123!');
  });

  it('should fail to save user without required fields', async () => {
    const userWithoutRequiredField = new User({ name: 'John Doe' });
    let err;
    
    try {
      await userWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should fail to save user with invalid email format', async () => {
    const userWithInvalidEmail = new User({
      name: 'John Doe',
      email: 'invalid-email',
      password: 'Password123!'
    });
    let err;
    
    try {
      await userWithInvalidEmail.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });
});
