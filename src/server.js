const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const seedAdmin = require('./utils/seeder');

// Load env vars
dotenv.config();

// Connect to database
connectDB().then(() => {
  seedAdmin();
});

// Route files
// Auth, Vehicles, Bookings, Payments, Users
const auth = require('./routes/auth');
const vehicles = require('./routes/vehicles');
const bookings = require('./routes/bookings');
const payments = require('./routes/paymentRoutes');
const users = require('./routes/users');
const detections = require('./routes/detections');
const upload = require('./routes/upload');
const damages = require('./routes/damages');
const driverAlerts = require('./routes/driverAlerts');
const realtimeLocation = require('./routes/realtimeLocation');

const app = express();

// Body parsers
// express.raw MUST be registered before express.json so ESP32 raw JPEG
// bodies are not rejected with 415 before reaching the upload route.
app.use(express.raw({ type: 'image/jpeg', limit: '5mb' }));
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/vehicles', vehicles);
app.use('/api/v1/bookings', bookings);
app.use('/api/v1/payments', payments);
app.use('/api/v1/users', users);
app.use('/api/detections', detections);
app.use('/api/upload', upload);
app.use('/api/damages', damages);
app.use('/api/driver-alerts', driverAlerts);
app.use('/api/realtime-location', realtimeLocation);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
