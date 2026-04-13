const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to avoid some SRV resolution issues
    });
    console.log(`✅ MongoDB Connected to Atlas: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    if (err.message.includes('ECONNREFUSED')) {
      console.log('💡 TIP: This SRV error often means your local DNS cannot resolve Atlas hostnames.');
      console.log('Try switching your computer DNS to Google (8.8.8.8) or Cloudflare (1.1.1.1).');
    }
    console.log('Also ensure your IP is whitelisted in MongoDB Atlas (Network Access -> Add IP Address).');
    process.exit(1);
  }
};

module.exports = connectDB;
