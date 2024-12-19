const request = require('supertest');
const app = require('./app');


it('POST /users', async () => {
    const res = await request(app).post('/users/signup').send({
      firstname:'Alex',
      lastname:'Doe',
      email: 'alex.doe@gmail.com',
      password: 'azerty',
      birthday:'2024-12-12',
      zipcode:'75017',
      isAssociationOwner:'false'
      
    });
   
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(true);
   });



   