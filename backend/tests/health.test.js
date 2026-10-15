import request from 'supertest';
import app from '../src/app.js';

describe('RoomSync System API Health Check', () => {
  it('should return 200 OK and supported factors metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ok');
    expect(res.body.service).toEqual('RoomSync API');
    expect(res.body.factorsSupported).toEqual(22);
    expect(res.body.algorithms).toContain('HardConstraintFilter');
    expect(res.body.algorithms).toContain('FuzzyLogicEngine');
    expect(res.body.algorithms).toContain('TOPSIS');
  });

  it('should return 404 for undefined routes with clean error format', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});
