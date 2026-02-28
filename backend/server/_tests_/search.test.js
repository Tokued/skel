const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const dbConnection = require("../config/db.config");

// your search routes
const searchAddRoute = require("../routes/searchAdd");
const searchGetAllRoute = require("../routes/searchGetAll");

const app = express();
app.use(express.json());
app.use("/search", searchAddRoute);
app.use("/search", searchGetAllRoute);

beforeAll(async () => {
  await dbConnection();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Search routes", () => {
  test("POST /search/add adds a search record", async () => {
    const res = await request(app)
      .post("/search/add")
      .send({
        username: "testuser",
        query: "batman",
        category: "movies",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.username).toBe("testuser");
    expect(res.body.query).toBe("batman");
  });

  test("GET /search/getAll returns all search records", async () => {
    const res = await request(app).get("/search/getAll");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});