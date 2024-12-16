
const request = require('supertest');
const app = require('./app'); // Import du fichier de l'app
const Association = require('./models/associations'); // Import de model
const mongoose = require('mongoose');

// Test data
const testAssociation = {
    _id: "675fee536e474fbb6a2651bb",
  name: "nouvelle nom de l'asso",
  owner: new mongoose.Types.ObjectId(), 
  description: 'This is a test association',
  siret: '12345678901234',
  email: 'test@association.com',
  phone: '1234567890',
  address: {
    street: 'Test Street',
    city: 'Test City',
    zipcode: '12345',
  },
  categories: ['Category 1', 'Category 2'],
};

describe('GET /associations/getasso/:id', () => {
  // Nettoyer avant chaque test
  beforeEach(async () => {
    await Association.deleteMany({});
    await Association.create(testAssociation);
  });

  it('It should return association data when called with a valid ID.', async () => {
    const response = await request(app).get(`/associations/getasso/${testAssociation._id}`);
    expect(response.status).toBe(200);
    expect(response.body.result).toBe(true);
    expect(response.body.association.name).toBe(testAssociation.name);
  });

  it('It should return error message when called with a false data.', async () => {
    const invalidId = new mongoose.Types.ObjectId(); //Create a false data 
    const response = await request(app).get(`/associations/getasso/${invalidId}`);
    expect(response.status).toBe(200);
    expect(response.body.result).toBe(false);
    expect(response.body.error).toBe('Association not found');
  });

  it('Take into account server errors', async () => {
    
    jest.spyOn(Association, 'findOne').mockRejectedValue(new Error('Database error'));
    const response = await request(app).get(`/associations/getasso/${testAssociation._id}`);
    expect(response.status).toBe(500);
    expect(response.body.result).toBe(false);
    expect(response.body.error).toBe('ERROR SERVER');
   
    jest.restoreAllMocks();
  });
});