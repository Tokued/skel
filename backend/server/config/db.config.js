const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

mongoose.set("strictQuery", false); // removes the deprecation warning

module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("The backend has connected to the MongoDB database.");
  } catch (error) {
    console.log(`${error} could not connect`);
    throw error;
  }
};