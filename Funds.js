const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('./authMiddleware'); // Import from authMiddleware.js

const router = express.Router(); // Use Router instead of app

// MongoDB Connection
mongoose
  .connect("mongodb+srv://akinolaabdulateef36:BsoJVJv7qCQMLSF4@cluster0.4i1we.mongodb.net/fundpal")
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to the 'uploads' folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Schema and Model
const FundSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  fundTitle: String,
  category: String,
  description: String,
  goal: Number,
  donationMethod: String,
  profileImage: String,
  createdAt: { type: Date, default: Date.now },
});

const Fund = mongoose.model('Fund', FundSchema);

// Routes
router.post('/funds', upload.single('profileImage'), async (req, res) => {
  try {
    const { body, file } = req;
    const profileImage = file ? `http://localhost:3000/uploads/${file.filename}` : null;

    const newFund = new Fund({
      ...body,
      profileImage,
    });

    await newFund.save();
    res.status(201).json({ message: 'Fund created successfully', fund: newFund });
  } catch (err) {
    res.status(500).json({ message: 'Error creating fund', error: err.message });
  }
});

router.get('/funds', async (req, res) => {
  try {
    const funds = await Fund.find();
    res.status(200).json(funds);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching funds', error: err.message });
  }
});

module.exports = router; // Export the router