require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

const seedAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-research');
    console.log('MongoDB connected for seeding...');

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    
    if (existingAdmin) {
      console.log(`Admin user '${username}' already exists. Updating password...`);
      const salt = await bcrypt.genSalt(10);
      existingAdmin.password = await bcrypt.hash(password, salt);
      await existingAdmin.save();
      console.log('Admin password updated successfully.');
    } else {
      console.log(`Creating new admin user: '${username}'...`);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newAdmin = new Admin({
        username,
        password: hashedPassword
      });

      await newAdmin.save();
      console.log('Admin user created successfully.');
    }

    mongoose.disconnect();
    console.log('Database disconnected. Seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedAdmin();
