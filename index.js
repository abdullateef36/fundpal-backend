const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads')); // Serve static files from the "uploads" folder

// MongoDB Connection
mongoose.connect("mongodb+srv://akinolaabdulateef36:BsoJVJv7qCQMLSF4@cluster0.4i1we.mongodb.net/fundpal")
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema & Model
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  phoneNumber: String,
  password: { type: String, required: true },
  country: Object,
  isAbove18: Boolean,
  isAgreedToTerms: Boolean,
  profileImage: String, // Path to the uploaded profile image
});

const User = mongoose.model('User', userSchema);

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory for storing uploaded images
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  },
});

// Default Route
app.get('/', (req, res) => {
  res.send('Welcome to FundPal');
});

// Signup Route
app.post('/signup', upload.single('profileImage'), async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password, country, isAbove18, isAgreedToTerms } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists. Please use a different email.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      country: JSON.parse(country), // Parse JSON string if sent as text
      isAbove18,
      isAgreedToTerms,
      profileImage: req.file ? `/uploads/${req.file.filename}` : null, // Save file path to database
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(400).json({ message: 'Error registering user', error });
  }
});

// Signin Route
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Wrong email or password' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET='5adf1a60a67439eb950d8c351c10c585df3695ff95e364ca6b8a16a0d488d85b' || 'defaultsecret',
      { expiresIn: '1h' }
    );

    // Send user info along with the token
    res.status(200).json({
      message: 'Sign-in successful',
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error during sign-in', error });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));