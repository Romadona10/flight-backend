const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());  // Use Express's built-in JSON parser
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded data
app.use(cors({
  origin: ['http://localhost:4200', 'https://romadona10.github.io'], // Add your GitHub Pages URL here
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// app.use(cors({ origin: '*' }));

// app.use(cors());

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || "mongodb+srv://okekekingsley558:8QCcO0urfRwFEtJR@flightsdb.tad5zfd.mongodb.net/?retryWrites=true&w=majority&appName=flightsdb"

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// User model
const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
});

const User = mongoose.model('User', UserSchema);

// Flight model
const flightSchema = new mongoose.Schema({
  

  flightCompany: String,
  departureAirport: String,
  arrivalAirport: String,
  departureTime: String,
  arrivalTime: String,
  totalPassengers: Number,
  price: Number,
  selectedSeats: [String],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Flight = mongoose.model('Flight', flightSchema);

// POST: Store new flight booking
app.post('/api/flights/book', async (req, res) => {
  console.log('Request Body:', req.body);
  console.log('successfully stored')
 
  try {
    const {
      
      userId,  
      flightCompany, 
      departureAirport, 
      arrivalAirport, 
      departureTime, 
      arrivalTime, 
      totalPassengers, 
      price, 
      selectedSeats
    } = req.body;

    console.log('Booking User ID for post:', userId);

    if ( !userId || !flightCompany || !departureAirport || !arrivalAirport || !departureTime || !arrivalTime || !totalPassengers || !price || !selectedSeats.length) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Ensure ObjectId is valid by using the 'new' keyword
    const flight = new Flight({
      
      userId: new mongoose.Types.ObjectId(userId.trim()),  // Corrected
      flightCompany,
      departureAirport,
      arrivalAirport,
      departureTime,
      arrivalTime,
      totalPassengers,
      price,
      selectedSeats
    });

    await flight.save();
    res.status(201).json(flight);
  } catch (error) {
    console.error('Error booking flight:', error);
    res.status(500).json({ message: 'Failed to book flight', error: error.message });
  }
});




// GET: Retrieve bookings for a user
// Route to retrieve bookings for a specific user
app.get('/api/flights/bookings/:userId', async (req, res) => {
  const userId = req.params.userId;
  console.log('Received request for user ID:', userId);
  try {
    const { userId } = req.params;

    console.log('User ID (backend):', userId);

    // Validate User ID
    if (!mongoose.Types.ObjectId.isValid(userId.trim())) {
      return res.status(400).json({ message: 'Invalid User ID' });
    }

    // Query the database for flights with the valid userId
    const flights = await Flight.find({ userId: userId.trim() });

    if (!flights.length) {
      return res.status(404).json({ message: 'No bookings found for this user' });
    }

    // Respond with found flights
    res.status(200).json(flights);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    
    // Avoid exposing internal error messages to clients
    res.status(500).json({ message: 'Failed to retrieve bookings' });
  }
});





// DELETE: Remove a flight booking
app.delete('/api/flights/book/:flightId', async (req, res) => {
  try {
    const { flightId } = req.params;

    // Ensure flightId is valid
    if (!mongoose.Types.ObjectId.isValid(flightId)) {
      return res.status(400).json({ message: 'Invalid Flight ID' });
    }

    const result = await Flight.findByIdAndDelete(flightId);
    if (!result) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.status(200).json({ message: 'Flight deleted successfully' });
  } catch (error) {
    console.error('Error deleting flight:', error);
    res.status(500).json({ message: 'Failed to delete flight', error: error.message });
  }
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = new User({ firstName, lastName, email, password });
    await newUser.save();

    res.status(201).json({ message: 'Registration successful', userId: newUser._id });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', userId: user._id });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
