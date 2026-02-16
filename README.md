# S.A.V.E.S Rental System Backend

A professional backend for a car rental booking system.

## 📚 Documentation
**[👉 Click here to view the Full Project Documentation](./PROJECT_DOCUMENTATION.md)**

The documentation includes:
- Setup Instructions
- API Reference (All Endpoints)
- Database Models
- Business Logic Explanation

## Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication

## Quick Start
1. `npm install`
2. Configure `.env`
3. `npm run dev`

## API Overview

### Auth
- **POST** `/api/v1/auth/register`
- **POST** `/api/v1/auth/login`

### Users (Admin)
- **GET** `/api/v1/users`

### Vehicles
- **GET** `/api/v1/vehicles`
- **POST** `/api/v1/vehicles` (Admin)

### Bookings
- **POST** `/api/v1/bookings`

See `PROJECT_DOCUMENTATION.md` for details.
