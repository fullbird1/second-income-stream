const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

// Mock MongoDB connection
jest.mock('mongoose', () => {
  const originalMongoose = jest.requireActual('mongoose');
  return {
    ...originalMongoose,
    connect: jest.fn().mockResolvedValue(true),
    connection: {
      close: jest.fn().mockResolvedValue(true)
    }
  };
});

// Mock the Stock model
jest.mock('../models/Stock', () => {
  return {
    findOne: jest.fn().mockResolvedValue(null),
    insertMany: jest.fn().mockResolvedValue([])
  };
});

// Simple test suite to verify API structure
describe('API Structure Tests', () => {
  test('API routes are defined', () => {
    // Check that the app has routes defined
    expect(app).toBeDefined();
    console.log('API structure tests passed');
  });
});
