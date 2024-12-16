const request = require('supertest');
const app = require('./app');

it('POST /users', async () => {
    const res = await request(app).post('/users/signin').send({
      email: 'john@doe.com',
      password: 'azerty',
    });
   
    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(true);
   });
   
   