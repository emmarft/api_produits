const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Product = require('../src/models/product.model');
const { closeDB } = require('../src/config/database');

let token = ''; // À remplacer par un vrai token JWT si auth requise

afterAll(async () => {
  await closeDB();
});

afterEach(async () => {
  await Product.deleteMany();
});

beforeAll(async () => {
  // Crée un utilisateur de test
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'test@test.com', password: 'test123' });

  // Connecte l'utilisateur pour obtenir un token JWT
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'test@test.com', password: 'test123' });

  token = `Bearer ${res.body.token}`;
});

describe('Produits API', () => {
  it('GET /api/products doit retourner un tableau', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/products doit créer un produit', async () => {
    const data = { name: 'Test', description: 'desc', price: 10, category: 'cat', stock: 5 };
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', token) // décommenté pour l'auth
      .send(data);
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test');
  });

  it('GET /api/products/:id doit retourner un produit', async () => {
    const prod = await Product.create({ name: 'Test', description: 'desc', price: 10, category: 'cat', stock: 5 });
    const res = await request(app).get(`/api/products/${prod._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Test');
  });

  it('PUT /api/products/:id doit modifier un produit', async () => {
    const prod = await Product.create({ name: 'Test', description: 'desc', price: 10, category: 'cat', stock: 5 });
    const res = await request(app)
      .put(`/api/products/${prod._id}`)
      .set('Authorization', token) // décommenté pour l'auth
      .send({ name: 'Modifié' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Modifié');
  });

  it('DELETE /api/products/:id doit supprimer un produit', async () => {
    const prod = await Product.create({ name: 'Test', description: 'desc', price: 10, category: 'cat', stock: 5 });
    const res = await request(app)
      .delete(`/api/products/${prod._id}`)
      .set('Authorization', token) // décommenté pour l'auth
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/supprimé/);
  });
});
