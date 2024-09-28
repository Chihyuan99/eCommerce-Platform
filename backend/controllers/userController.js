import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import nodemailer from 'nodemailer'; 
import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
dotenv.config();

// Generate JWT
const generateToken = (id, isAdmin) => {
  return jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// User login
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id, user.isAdmin),
      });
    } else {
      res.status(401).json({
        message: 'Invalid email or password',
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Server error during login',
      error: error.message,
    });
  }
});

// Register new user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, isAdmin } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      isAdmin,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id, user.isAdmin),
      });
    } else {
      res.status(400).json({
        message: 'Invalid user data',
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Server error during registration',
      error: error.message,
    });
  }
});

const logoutUser = asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'User logged out successfully' });
  });

// Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(404).json({
        message: 'User not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Server error fetching user profile',
      error: error.message,
    });
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const frontendUrl = req.headers['frontend_url']

  // Check if user exists with that email
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Add a timestamp or random number to make the token unique each time
  const timestamp = Date.now(); // You can also use randomBytes for randomness
  const dataToEncode = `${email}:${timestamp}`; // Combine email and timestamp

  // Encode the email and timestamp into the token
  const resetToken = Buffer.from(dataToEncode).toString('hex');
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const message = `
    <h1>Password Reset Request</h1>
    <p>You requested a password reset. Please click on the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>If you did not request this, please ignore this email.</p>
  `;

  try {
    console.log('Sending email to:', user.email); 
    await sgMail.send({
      to: user.email,
      from: 'ecommercemanagementchuwa@gmail.com',
      subject: 'Password Reset Request',
      html: message,
    });

    res.status(200).json({ message: 'Email sent successfully', resetToken });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      message: 'Email could not be sent',
      error: error.message,
    });
  }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params; // Token from URL
  // console.log('Token received by backend:', token); 
  const { password, email } = req.body; // Password and email from request
  // console.log('Password received by backend:', password); 


  // Decode token using hex
  const decodedData = Buffer.from(token, 'hex').toString('utf8'); // Ensure this matches how the token was encoded
  const [decodedEmail, timestamp] = decodedData.split(':'); // Split the email and timestamp

  // console.log('Decoded email:', decodedEmail);
  // console.log('Timestamp:', timestamp);

// Find user by email
  const user = await User.findOne({ email: decodedEmail });

  if (!user) {
    res.status(400).json({ message: 'Invalid or expired token' });
    return;
  }

  // Set new password
  user.password = password;
  await user.save();

  res.status(200).json({ message: 'Password reset successful' });
});

export { authUser, registerUser, getUserProfile, logoutUser, forgotPassword, resetPassword };