const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://someshrocks144:g8tG0R77gcTHiNtO@cluster0.az6qzw3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0x"
    );
    console.log("Connected to DB");
  } catch (error) {
    console.log(error);
  }
};

module.exports = connectDB;
