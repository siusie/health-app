# Tummy Time Web Application Technical Artifact
*Project Implementation – Yasser Elmankabady*  
*PRJ666 – NCC*  
*April 9th, 2025*

*Team 06: Xi, Anh, Le, Nickolas*

Author - 102874229, Nickolas Liapkov, <nliapkov1@mysenca.ca>

## Table Of Contents

- [Directory Structure](#directory-structure)
  - [Top Level](#top-level)
  - [Backend Structure](#backend-structure)
  - [Frontend Structure](#frontend-structure)
- [Software Requirements](#software-requirements)
  - [Server Environment](#server-environment)
  - [Development Environment](#development-environment)
  - [Client Environment](#client-environment)
- [System Architecture & Integration](#system-architecture--integration)
  - [Cloud Services](#cloud-services)
- [Performance Requirements](#performance-requirements)
  - [Response Time](#response-time)
  - [Scalability](#scalability)
  - [Availability](#availability)
  - [Real-time Updates](#real-time-updates)
- [Security Requirements](#security-requirements)
  - [Data Protection](#data-protection)
  - [Authentication](#authentication)
  - [Access Control](#access-control)
  - [Compliance](#compliance)
  - [Network Security](#network-security)
  - [Third-party Security](#third-party-security)
- [Constraints & Limitations](#constraints--limitations)
- [Additional Technical Details](#additional-technical-details)
  - [Accessibility Features](#accessibility-features)
  - [Voice Recognition](#voice-recognition)
  - [Safety Alert System](#safety-alert-system)
  - [Responsive Design](#responsive-design)
  - [Main API Categories](#main-api-categories)

# Directory Structure

## Top Level

```
/
├── .git/                  # Git repository data
├── .github/               # GitHub configurations and workflows
├── .gitignore             # Git ignore file
├── client/                # Frontend application
├── README.md              # Project overview
└── server/                # Backend application
```

## Backend Structure

```
server/
├── .env                              # Environment variables
├── .env.jest                         # Jest Environment variables
├── database/                         # Database configuration and connection
│   ├── childcare_db.js               # Database for childcare providers
│   ├── db.js                         # Main database connection module
│   └── HCRSAMOpenData.json           # Health Canada data
├── mockData/                         # Mock data for testing
├── src/                              # Source code
│   ├── app.js                        # Express application setup
│   ├── auth/                         # Authentication modules
│   ├── index.js                      # Entry point
│   ├── model/                        # Data models
│   ├── routes/                       # API routes
│   │   └── api/                      # API endpoints grouped by functionality
│   ├── server.js                     # Server configuration
│   └── utils/                        # Utility functions
├── tests/                            # Test files
│   └── unit/                         # Unit tests
│       ├── baby/                     # Baby-related tests
│       ├── coupons/                  # Coupon-related tests
│       ├── forum/                    # Forum-related tests
│       ├── login.test.js             # Login functionality tests
│       └── ...                       # Other test files
```

## Frontend Structure

```
client/
├── .env.local                        # Local environment variables
├── components/                       # React components
├── context/                          # React Context API providers
├── hooks/                            # Custom React hooks
├── pages/                            # Next.js pages and routing
├── public/                           # Static assets
├── scripts/                          # Utility scripts
├── services/                         # API service layer
├── styles/                           # CSS and styling
└── utils/                            # Utility functions
```

# Software Requirements

## Server Environment

Backend: Node hosted on Render

Database: Postgres hosted using Supabase and Neon Tech

## Development Environment

Version Control: GitHub

Dev Tools: Visual Studio Code

CI/CD: GitHub Actions

## Client Environment

Frontend: Nextjs hosted on Vercel

Supported Browsers: Google Chrome, Firefox, Edge

Responsive design compatible with iPad Air (resolution 1180 by 820 and up)

# System Architecture & Integration

## Cloud Services:

Primary Hosting/DB: Vercel, Render, Supabase, Neon Tech

Authentication: AWS Cognito for SSO and user management

Speech Services: AWS Transcribe for accessibility features

Third-Party Integrations

- LinkMyDeals API
  - Free 25 calls per day
- OpenAI API
  - Using free model, no expenses
- BarcodeLookup API
  - Must refresh token regularly

# Performance Requirements

## Response Time:

Page loads within 0-3 seconds for at least 95% of users

## Scalability:

System must support up to 10,000+ concurrent users

AWS auto-scaling capabilities to handle traffic increases without performance

## Availability:

High availability infrastructure using AWS cloud services

Redundancy for critical system components

## Real-time Updates:

Data synchronization across all devices with minimal delay

Immediate reflection of changes across connected devices

# Security Requirements

## Data Protection:

Encryption of all user data both at rest and in transit using AWS encryption services

SSL certificates for secure HTTPS communication

Secure storage of sensitive baby health information

## Authentication:

AWS Cognito implementation for secure user authentication using email and password

## Access Control:

Role based access (RBAC) to restrict access based on user roles

Different permission levels for parents, caregivers and medical professionals

## Compliance:

Adhere to Canadian data privacy regulations (PIPEDA)

Regular security audits and vulnerability assessments

## Network Security:

Cloud-based firewall implementation

Protection against unauthorized access and intrusions

## Third-party Security:

All third-party security compliance

Regular review of third-party security compliance

# Constraints & Limitations

Application will be web-based, not available as a standalone mobile application

No support for outdated browser versions

No support for screen resolution lower than 1180 by 820

Functionality Constraints:

- No social media integration for registration or login
- No e-commerce functionality for direct sales of baby-related products
- No private messaging features beyond community forums
- No third-party advertisements
- Users cannot contact service providers directly through our application
- No smart device or advanced AI anomaly detection functionality

Integration Limitations:

- Barcode scanning limited to products from Barcode Lookup API

# Additional Technical Details

## Accessibility Features:

Multi-language support in settings

Voice command functionality for specific actions (e.g., "feeding schedule")

Text-to-speech capabilities for reading journal and forum posts/replies

Speech-to-text for journal entries and health metric inputs

## Voice Recognition:

Voice commands limited to specific actions to ensure accuracy

AWS Transcribe for speech-to-text conversion

## Safety Alert System:

Integration with barcode lookup API

Barcode scanning functionality for product checks

## Responsive Design:

UI for device sizes and resolutions (from 1180 by 820 and up)

Minimum supported resolution of 720p

## Main API Categories:

- Baby management (/api/baby/*)
- Care services (/api/careServices/*)
- Messaging/Chat (/api/chat/*)
- Coupon management (/api/coupons/*)
- Doctor services (/api/doctor/*)
- Data export (/api/export/*)
- Forum functionality (/api/forum/*)
- Growth tracking (/api/growth/*)
- Health records management (/api/healthRecord/*)
- Journaling capabilities (/api/journal/*)
- Medical professional services (/api/medicalProfessional/*)
- Milestone tracking (/api/milestones/*)
- Parent management (/api/parent/*)
- Product information (/api/products/*)
- Profile picture handling (/api/profilePicture/*)
- Quiz functionality (/api/quiz/*)
- Health tips (/api/tips/*)
- User management (/api/user/*)
- Voice command processing (/api/voiceCommand/*)