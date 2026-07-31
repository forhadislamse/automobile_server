# SmartAutoTech (Backend)

<p align="center">
  <img src="https://automobile-frontend-six.vercel.app/Logo.png" alt="SmartAutoTech App" width="150" height="150"/>
</p>

A comprehensive backend system for **SmartAutoTech** - an AI-powered diagnostic and shop management platform. It serves as the core API for a modern SaaS platform where auto shop owners and technicians can manage shop workflows, diagnostic reports, and vehicle records. The system includes robust authentication, role-based access control (Admin, Shop Owner, Technician), subscription management via Stripe, and dynamic data handling.

Technologies Used: **Node.js, Express.js, TypeScript, Prisma, MongoDB, JWT Auth, Stripe Payment Gateway, VPS Hosting (Vercel)**.

**Local:**  
http://localhost:33079/api/v1

**Live:**  
https://automobile-server-orcin.vercel.app/

**Postman Documentation**  
https://documenter.getpostman.com/view/34968572/2sBY4TpHwc

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Features](#features)
- [Technology Used](#technology-used)
- [Folder Structure](#folder-structure)
- [Licenses](#licenses)


## Requirements

Before starting the project, ensure that the following dependencies are installed on your system:

- **Node.js** (v18+)
- **MongoDB** (Running locally or a cloud-based instance such as MongoDB Atlas)
- **NPM or Yarn** for package management
- **Environment variables setup**


## Installation
**1. Clone the repository:**

```bash
   git clone https://github.com/forhadislamse/automobile_server.git
   cd automobile_server

   # Using npm:
   npm install
```

**2. Create a `.env` file** in the root of the project directory to store environment variables. 

*Please refer to the `.env.example` file in the root directory for all required environment variables and their formats.*

## Running the Application

We can run the application using the following npm scripts:

### **1. Start the application in development mode:**
For development, we use the `dev` script, which runs the application using `ts-node-dev`, so it will automatically reload on file changes:
```bash
npm run dev
```

### **2. Start the application:**
After building the application, we can start it with the following command:
```bash
npm run start
```

### **3. Build the application:**
This command compiles the TypeScript files into JavaScript files:
```bash
npm run build
```

## Features

### User Features
- **Shop Management:** Seamlessly onboard auto shops and manage technicians.
- **Subscriptions:** Securely purchase monthly or yearly access plans with Stripe, including 14-day free trials.
- **Profile Management:** Manage personal details, roles, and profile settings.
- **OTP Verification:** Secure email verification for new signups and password resets.

### Admin Features
- **Subscription Management:** View and manage shop subscriptions and Stripe transactions.
- **User Dashboard:** Monitor total active shops, technicians, and revenue statistics.
- **Plan Management:** Dynamically manage subscription tiers and pricing.

### Common / System Features
- **Secure Authentication:** JWT-based login, password hashing, and OTP password resets.
- **Payment Integration:** Fully integrated Stripe checkout and secure webhook event handling (`payment_succeeded`, `subscription.updated`, etc.).
- **Role-based Access Control:** Strict authorization differentiating Admins, Shop Owners, and Technicians.

## Technology Used

- **[Express](https://expressjs.com/)** – Fast, unopinionated, minimalist web framework for Node.js.
- **[TypeScript](https://www.typescriptlang.org/)** – Strongly typed programming language built on JavaScript.
- **[MongoDB](https://www.mongodb.com/)** – Flexible, scalable NoSQL database.
- **[Prisma](https://www.prisma.io/)** – Next-generation ORM used to map MongoDB schemas in TypeScript.
- **[Zod](https://github.com/colinhacks/zod)** – TypeScript-first schema declaration and validation library.
- **[Stripe](https://stripe.com/)** – Payment gateway for processing recurring and one-time subscriptions.

## Folder Structure

```
├── prisma
│   └── schema.prisma
│
└── src
    ├── app.ts
    ├── server.ts
    │
    ├── app
    │   ├── middlewares
    │   │   ├── auth.ts
    │   │   ├── globalErrorHandler.ts
    │   │   └── validateRequest.ts
    │   │
    │   ├── modules
    │   │   ├── Admin           # Admin stats and dashboard management
    │   │   ├── Auth            # Authentication (Login, Register, OTP)
    │   │   ├── Payment         # Stripe webhook and transactions
    │   │   ├── Plan            # Subscription plans
    │   │   ├── Shop            # Shop onboarding and management
    │   │   ├── Technician      # Technician data and workflows
    │   │   └── User            # User profile and settings
    │   │
    │   └── routes
    │       └── index.ts
    │
    ├── config
    │   └── index.ts
    │
    ├── errors
    │   ├── ApiError.ts
    │   └── handleZodError.ts
    │
    ├── helpars
    │   ├── jwtHelpers.ts
    │   ├── paginationHelper.ts
    │   └── template          # Email HTML templates
    │
    └── shared
        ├── catchAsync.ts
        ├── emailSender.ts
        ├── sendResponse.ts
        └── stripe.ts
```

*(Note: Please refer to the Postman documentation link provided above for all API endpoints, request parameters, and response formats.)*

## Licenses

This project is proprietary and intended for the SmartAutoTech platform.

## Happy Coding! 