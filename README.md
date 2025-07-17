# Overview

A baby care app for parents, caregivers, and medical professionals. Features dynamic feeding schedules, diaper and growth tracking, journaling, AI-driven assistance, exportable health reports, and a gamified quiz to engage users in baby care tracking. The app is deployed [here](https://team-06-prj-666-winter-2025.vercel.app/).

# Project Installation Guide

This guide will help you set up and run the project locally. Follow the steps below to install dependencies, configure the environment, and launch the application.

## Table Of Contents

1. [Overview](#overview)
2. [Project Installation Guide](#project-installation-guide)
   - [Prerequisites](#prerequisites)
   - [1. Clone the Repository](#1-clone-the-repository)
   - [2. Install Dependencies](#2-install-dependencies)
   - [3. Environment Configuration](#3-environment-configuration)
   - [4. Database Setup](#4-database-setup)
   - [5. Run the Application](#5-run-the-application)
   - [6. Access the Application](#6-access-the-application)
   - [7. Public Server Instructions](#7-public-server-instructions)
   - [8. Test Account Credentials](#8-test-account-credentials)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or later)

- npm

- Git

- Database (PostgreSQL)

**1. Clone the Repository**

```
git clone https://github.com/siusie/tummy-time.git

cd your-project
```

**2. Install Dependencies**

**Backend Setup**

```
cd server

npm install
```

**Frontend Setup**

```
cd client

npm install
```

**3. Environment Configuration**

**Backend (.env setup)**

Create a .env file in the backend folder with required variables:

```
PORT=8080

API_URL=http://localhost:8080/

LOG_LEVEL=debug

# AWS Amazon Cognito User Pool ID (use your User Pool ID)
AWS_COGNITO_POOL_ID=<your_own_key>

# AWS Amazon Cognito Client App ID (use your Client App ID)
AWS_COGNITO_CLIENT_ID=<your_own_key>

AWS_REGION=<your_own_key>

#TummyTime: Use this one for everyone in the team
AWS_ACCESS_KEY_ID=<your_own_key>
AWS_SECRET_ACCESS_KEY=<your_own_key>

POSTGRES_PASSWORD=<your_own_key>

# Local: postgres
# Cognito: cognito
AUTH_METHOD=cognito

# Connection string for the database (Render)
INTERNAL_DB_URL=<your_own_key>

# Password for the database (Supabase)
SUPABASE_PASSWORD=<your_own_key>
SUPABASE_CONNECTION_URL=<your_own_key>
SUPABASE_API_KEY=<your_own_key>
# DATABASE_URL=<your_own_key>

DATABASE_URL=postgresql:<your_own_key>

# Decid to use Supabase or local database
USE_LOCAL_DB=true

# Barcode Scanner API Key
BARCODE_SCANNER_API_KEY=<your_own_key>

# Connection string for the extended childcare service database
CHILDCARE_SERVICES_DB=<your_own_key>
```

**Frontend (.env setup)**
Create a .env.local file in the frontend folder:

```
// deployment:
# NEXT_PUBLIC_API_URL=https://tummytime-server.onrender.com
# NEXT_PUBLIC_CLIENT_URL=https://tummy-time.vercel.app

// local
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000

NEXT_PUBLIC_LINKMYDEALS_API_KEY=<your_own_key>
```

**4. Database Setup**
You need to download and install the [PostgresSQL](https://www.postgresql.org/download/) database as your local database if you want to run to test this app locally.

Information to set up the database:

- Database name: 'TummyTime'
- Host: 'localhost'
- User: 'postgres'
- Port: 5432

To create tables in your database, you can run the SQL script under `server/database/tummyTime.sql`

**5. Run the Application**
**Start Backend**

```
cd server

npm run dev
```

**Start Frontend**

```
cd client

npm run dev
```

**6. Access the Application**

- Frontend: Open http://localhost:3000 (or specified port)

- Backend API: Runs on http://localhost:8080 (or configured port)

**7. Public Server Instructions**

- Backend: Hosted on Render, auto-deployed from main branch

- Frontend: Hosted on Vercel

- Database: Hosted on Supabase
