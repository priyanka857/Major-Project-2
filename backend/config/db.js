const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Atlas URI irundha atha use pannum, illati Local use pannum
    const conn = await mongoose.connect(
      process.env.ATLAS_MONGO_URI || process.env.LOCAL_MONGO_URI,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
