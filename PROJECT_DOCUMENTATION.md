# S.A.V.E.S Rental System - Project Documentation

## 1. Overview

The **S.A.V.E.S Rental System** is a professional backend service designed for booking electric rental cars. It features a robust MVC architecture, JWT-based authentication, Role-Based Access Control (RBAC), and automated business logic for vehicle availability and pricing.

---

## 2. Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Bcryptjs (Password Hashing)
- **Validation**: Express-Validator

---

## 3. Getting Started

### Prerequisites

- Node.js installed
- MongoDB connection string (Atlas or Local)

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables:
    Create a `.env` file in the root directory:
    ```env
    PORT=5001
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    NODE_ENV=development
    ```

### Running the Server

- **Development Mode** (with nodemon):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

---

## 4. Folder Structure

```
src/
├── config/         # Database connection logic
├── controllers/    # Request handlers (Business logic)
├── middleware/     # Auth, Error handling, Validation
├── models/         # Mongoose Schemas (Data layer)
├── routes/         # API Route definitions
├── utils/          # Helper functions (ErrorResponse, Seeder)
└── server.js       # App entry point
```

---

## 5. Database Models

### User

- **name**: String (Required)
- **email**: String (Unique, Validated)
- **password**: String (Hashed)
- **role**: Enum [`client`, `admin`] (Default: `client`)

### Vehicle

- **model**: Enum [`SAVES_PROTOTYPE_V1`]
- **variant**: Enum [`SUV`, `SEDAN`]
- **plateNumber**: String (Unique)
- **year**: Number
- **color**: String
- **pricePerDay**: Number
- **status**: Enum [`Available`, `Booked`, `Maintenance`, `Stolen`, `Accident`] (Default: `Available`)
- **location**: Object `{ city, lat, lng }`
- **images**: Array of Strings

### Booking

- **user**: ObjectId (Ref: User)
- **vehicle**: ObjectId (Ref: Vehicle)
- **startDate**: Date
- **endDate**: Date
- **totalDays**: Number (Auto-calculated)
- **totalPrice**: Number (Auto-calculated)
- **status**: Enum [`pending`, `confirmed`, `cancelled`, `completed`]
- **paymentStatus**: Enum [`unpaid`, `paid`]

### Payment

- **booking**: ObjectId (Ref: Booking)
- **user**: ObjectId (Ref: User)
- **amount**: Number
- **method**: Enum [`card`, `cash`]
- **status**: Enum [`pending`, `completed`, `failed`]

---

## 6. Business Logic & Automation

1.  **Admin Seeding**:

    - On server start, the system automatically checks for an admin user (`admin@saves.com`) and creates it if missing.

2.  **Booking Validation**:

    - Prevents booking if vehicle status is not `Available` (e.g., checks for Maintenance, Stolen, Accident).
    - Prevents overlapping bookings for the same vehicle.
    - Automatically calculates `totalDays` and `totalPrice`.

3.  **Status Automation**:
    - **Booking Confirmed** → Vehicle status updates to `Booked`.
    - **Booking Completed/Cancelled** → Vehicle status updates to `Available`.

---

## 7. API Reference

**Base URL**: `http://localhost:5000/api/v1`

### Authentication

| Method | Endpoint                        | Description                           | Access  |
| :----- | :------------------------------ | :------------------------------------ | :------ |
| POST   | `/auth/register`                | Register a new user                   | Public  |
| POST   | `/auth/login`                   | Login and get token                   | Public  |
| GET    | `/auth/me`                      | Get current user details              | Private |
| POST   | `/auth/upload-photo`            | Upload profile image for current user | Private |
| GET    | `/auth/profile-image/:filename` | Get profile image file (JWT)          | Private |
| GET    | `/auth/agency`                  | Get agency info (Public)              | Public  |
| PUT    | `/auth/agency`                  | Update admin agency name/location     | Admin   |

### Users (Admin Only)

| Method | Endpoint     | Description     | Access |
| :----- | :----------- | :-------------- | :----- |
| GET    | `/users`     | Get all users   | Admin  |
| GET    | `/users/:id` | Get single user | Admin  |
| POST   | `/users`     | Create user     | Admin  |
| PUT    | `/users/:id` | Update user     | Admin  |
| DELETE | `/users/:id` | Delete user     | Admin  |

### Vehicles

| Method | Endpoint        | Description                    | Access |
| :----- | :-------------- | :----------------------------- | :----- |
| GET    | `/vehicles`     | Get all vehicles (Filterable)  | Public |
| GET    | `/vehicles/:id` | Get single vehicle             | Public |
| POST   | `/vehicles`     | Create vehicle                 | Admin  |
| PUT    | `/vehicles/:id` | Update vehicle (Price, Status) | Admin  |
| DELETE | `/vehicles/:id` | Delete vehicle                 | Admin  |

When an admin creates a vehicle, the API stores the admin agency snapshot on the vehicle:
`agency.name`, `agency.location` and `createdBy`.

**Vehicle Status Update Example:**
To mark a car as stolen or in maintenance:
`PUT /vehicles/:id`

```json
{
  "status": "Stolen"
}
```

### Bookings

| Method | Endpoint        | Description                          | Access  |
| :----- | :-------------- | :----------------------------------- | :------ |
| GET    | `/bookings`     | Get bookings (User: own, Admin: all) | Private |
| POST   | `/bookings`     | Create a booking                     | Private |
| GET    | `/bookings/:id` | Get booking details                  | Private |
| PUT    | `/bookings/:id` | Update booking status                | Private |

### Payments

| Method | Endpoint    | Description      | Access  |
| :----- | :---------- | :--------------- | :------ |
| POST   | `/payments` | Record a payment | Private |

---

## 8. Testing with Postman

1.  **Set Environment**: Create a variable `URL` = `http://localhost:5000/api/v1`.
2.  **Auth**: Login as Admin (`admin@saves.com` / `saves123@A`) to get a token.
3.  **Headers**: Add `Authorization: Bearer <your_token>` to protected requests.
