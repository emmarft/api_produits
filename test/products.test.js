const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Product = require('../src/models/product.model');

let token = ''; // À remplacer par un vrai token JWT si auth requise

beforeAll(async () => {
  // Connexion à la base de test
  await mongoose.connect(process.env.MONGO_URI);
  // Génère un token JWT si nécessaire
  // token = 'Bearer ...';
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  await Product.deleteMany();
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
      // .set('Authorization', token) // décommente si auth requise
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
      // .set('Authorization', token)
      .send({ name: 'Modifié' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Modifié');
  });

  it('DELETE /api/products/:id doit supprimer un produit', async () => {
    const prod = await Product.create({ name: 'Test', description: 'desc', price: 10, category: 'cat', stock: 5 });
    const res = await request(app)
      .delete(`/api/products/${prod._id}`)
      // .set('Authorization', token)
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/supprimé/);
  });
});
