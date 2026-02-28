// config/db.config.js
const mongoose = require("mongoose");

const dbConnection = () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MongoDB connection string (MONGO_URI) is not set!");
    process.exit(1);
  }

  mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log("Connected to MongoDB successfully"))
    .catch((err) => console.error("Could not connect to MongoDB", err));
};

module.exports = dbConnection;