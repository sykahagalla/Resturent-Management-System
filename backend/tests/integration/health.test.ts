import request from 'supertest';
import { app } from '../../src/server';
import mongoose from 'mongoose';
import { describe, it, expect, afterAll } from '@jest/globals';

// Ensure the server doesn't keep running after tests
afterAll(async () => {
  await mongoose.disconnect();
});

describe('Health Check API', () => {
  it('should return 200 OK for /api/health', async () => {
    const res = await request(app).get('/api/health');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('message', 'FlavorDash API is running');
  });
});
