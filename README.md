# University Course Registration System - Huye District

A modern, centralized system for managing student registrations, course selections, and academic records.

## Features
- **Modern UI**: Glassmorphism design with responsive layouts.
- **Role-Based Access**:
  - **Admin**: CRUD operations for students and courses, university-wide reports.
  - **Student**: Course enrollment (Register/Drop) and personal academic reports.
- **Centralized Database**: MySQL backend for data integrity and tracking.
- **Reporting**: Generate and print course registration reports.

## Tech Stack
- **Frontend**: React (Vite), Lucide Icons, Axios.
- **Backend**: Node.js, Express, MySQL.
- **Auth**: JWT-based authentication with bcrypt hashing.

## Setup
1. **Database**: Ensure MySQL is running on `localhost`. The system will automatically create `university_db` and required tables.
2. **Server**: 
   - `cd server`
   - `npm install`
   - `npm run dev`
3. **Client**:
   - `cd client`
   - `npm install`
   - `npm run dev`

## Default Credentials
- **Admin**: `admin` / `admin123`
- **Students**: Created by Admin through the dashboard.
