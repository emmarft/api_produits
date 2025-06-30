const request = require('supertest');
const app = require('../src/app');

describe('GET /api/products', () => {
  it('devrait retourner un tableau de produits', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
