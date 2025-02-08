import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Appointment from './models/AppointmentModel.js';
import User from './models/User.js'; // Assuming you have a User model
import { Router } from 'express'; // Router for handling routes

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017/Km-hospital', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

// Middleware
app.use(
  cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  })
);
app.use(express.json()); // Parse JSON request bodies

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

// Function to send email
const sendAppointmentEmail = async (appointment) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender's email
    to: appointment.email, // Recipient's email
    subject: 'Appointment Confirmation',
    text: `
Dear ${appointment.name} ${appointment.lastName},

Thank you for booking an appointment with KM Hospital.

Appointment Details:
- Date: ${new Date(appointment.date).toLocaleString()}
- Message: ${appointment.message || 'No additional message provided.'}

We look forward to seeing you!

Best regards,
KM Hospital
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', appointment.email);
  } catch (error) {
    console.error('Error sending email:', error.message || error);
  }
};

// POST: Create an appointment
app.post('/api/appointments', async (req, res) => {
  const { name, lastName, email, phone, date, message } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !date) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    // Save appointment to the database
    const appointment = new Appointment({
      name,
      lastName,
      email,
      phone,
      date,
      message,
    });
    await appointment.save();

    // Send confirmation email
    await sendAppointmentEmail(appointment);

    // Respond to the client
    res.status(201).json({
      message: 'Appointment created successfully!',
      appointment,
    });
  } catch (error) {
    console.error('Error saving appointment:', error);
    res.status(500).json({ message: 'Error saving appointment. Please try again later.' });
  }
});

// GET: Retrieve all appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().where({ date: { $gte: new Date() } });
    res.status(200).json({ message: 'Appointments retrieved successfully!', appointments });
  } catch (error) {
    console.error('Error retrieving appointments:', error);
    res.status(500).json({ message: 'Error retrieving appointments.' });
  }
});

app.get('/api/manage-appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find(); // Fetch all appointments (past & future)
    res.status(200).json({ message: 'All appointments retrieved successfully!', appointments });
  } catch (error) {
    console.error('Error retrieving all appointments:', error);
    res.status(500).json({ message: 'Error retrieving appointments.' });
  }
});

// app.get('/api/appointments/today', async (req, res) => {
//   try {
//     // Get today's date in YYYY-MM-DD format
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Find appointments where the date matches today
//     const todaysAppointments = await Appointment.find({
//       date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
//     });

//     res.status(200).json(todaysAppointments);
//   } catch (error) {
//     console.error('Error retrieving today’s appointments:', error);
//     res.status(500).json({ message: 'Error retrieving today’s appointments.' });
//   }
// });


// Signup 

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Only allow signup for this specific email
  if (email !== 'kmmhospitalpimpri@gmail.com') {
    return res.status(403).json({ message: "This email is not authorized to sign up" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Directly save the plain text password
    const newUser = new User({ name, email, password });  // Store password directly
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error occurred while registering user." });
  }
});


// **Login Route**
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Only allow login for this specific email
  if (email !== 'kmmhospitalpimpri@gmail.com') {
    return res.status(403).json({ message: "This email is not authorized to login" });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare passwords (no hashing in this case)
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Login successful
    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ message: "Error occurred while logging in." });
  }
});

// DELETE: Clear all appointments
app.delete('/api/appointments/clear', async (req, res) => {
  try {
    await Appointment.deleteMany();  // Delete all appointments
    res.status(200).json({ message: 'All appointments cleared successfully.' });
  } catch (error) {
    console.error('Error clearing appointments:', error);
    res.status(500).json({ message: 'Error clearing appointments.' });
  }
});
  



// Catch-all for undefined routes
app.all('*', (req, res) => {
  res.status(404).json({ message: 'Requested resource could not be found.' });
});

// Start the server
app.listen(PORT, '192.168.29.104', () => {
  console.log(`Server is running on http:// 192.168.29.104:${PORT}`);
});
