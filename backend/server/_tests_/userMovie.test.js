const path = require("path");

// Force Jest to run from backend/server
process.chdir(path.join(__dirname, ".."));

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

// Load db config and routes using absolute-safe paths
const dbConnection = require(path.resolve(__dirname, "..", "config", "db.config.js"));
const addRoute = require(path.resolve(__dirname, "..", "routes", "userMovieAdd.js"));
const getAllRoute = require(path.resolve(__dirname, "..", "routes", "userMovieGetAll.js"));

const app = express();
app.use(express.json());
app.use("/user-movie", addRoute);
app.use("/user-movie", getAllRoute);

beforeAll(async () => {
  await dbConnection();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("UserMovie routes", () => {
  test("POST /user-movie/add adds a record", async () => {
    const res = await request(app)
      .post("/user-movie/add")
      .send({
        username: "testuser",
        movieId: "12345",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.username).toBe("testuser");
    expect(res.body.movieId).toBe("12345");
  });

  test("GET /user-movie/getAll returns all records", async () => {
    const res = await request(app).get("/user-movie/getAll");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});