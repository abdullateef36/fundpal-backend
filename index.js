const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

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
});

const User = mongoose.model('User', userSchema);

// Default Route
app.get('/', (req, res) => {
  res.send('Welcome to FundPal');
});

// Signup Route
app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password, country, isAbove18, isAgreedToTerms } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      country,
      isAbove18,
      isAgreedToTerms,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error registering user', error });
  }
});

// Signin Route
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET='5adf1a60a67439eb950d8c351c10c585df3695ff95e364ca6b8a16a0d488d85b' || 'defaultsecret', {
      expiresIn: '1h',
    });

    res.status(200).json({
      message: 'Sign-in successful',
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error during sign-in', error });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
