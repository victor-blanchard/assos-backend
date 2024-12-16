const request = require("supertest");
const app = require("./app");

it("GET /events", async () => {
  const res = await request(app).get("/events/filtered");

  expect(res.statusCode).toBe(200);
  expect(res.body.result).toBe(true);
});
