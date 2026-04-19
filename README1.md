# 🎪 SmartVenueX - Premium Event Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-20+-43853D?style=flat-square&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![JavaScript](https://img.shields.io/badge/JavaScript-91.3%25-F7DF1E?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TypeScript](https://img.shields.io/badge/TypeScript-2.7%25-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Firebase](https://img.shields.io/badge/Firebase-Hosted-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)

> 🚀 **Transform Event Management Into A Seamless Digital Experience**

SmartVenueX is a production-grade **SaaS platform** designed for large-scale events with enterprise-grade security, AI-powered automation, and real-time collaboration features. Perfect for conferences, festivals, concerts, and corporate events with hundreds to thousands of participants.

---

## 📑 Quick Navigation

| Section | Description |
|---------|-------------|
| 🎯 [Overview](#-overview) | Key features and value proposition |
| 💎 [Features](#-key-features) | Complete feature breakdown |
| 🛠️ [Tech Stack](#-tech-stack) | All technologies used |
| 📋 [Prerequisites](#-prerequisites) | What you need to get started |
| 📁 [Structure](#-project-structure) | Project directory layout |
| 🚀 [Installation](#-installation) | Step-by-step setup guide |
| 🔧 [Environment](#-environment-setup) | API key configuration |
| 📖 [Usage](#-usage-guide) | How to use the platform |
| 🔌 [API](#-api-documentation) | Complete API reference |
| 🌐 [Deploy](#-deployment) | Firebase hosting setup |
| 🤝 [Contribute](#-contributing) | How to contribute |
| 🐛 [Troubleshoot](#-troubleshooting) | Common issues & fixes |

---

## 🎨 Overview

### What is SmartVenueX?

SmartVenueX is a **comprehensive event management solution** that puts powerful tools in the hands of event organizers, venue managers, and participants. Built with modern technologies and designed for scale.

#### 👥 Who It's For

- **Event Organizers**: Manage large-scale conferences, festivals, and corporate events
- **Venue Operators**: Control multiple simultaneous events across different spaces
- **Participants**: Seamless registration, QR passes, and real-time updates
- **Vendors/Stalls**: Real-time order management and inventory tracking

#### ✨ Core Benefits

| Benefit | Impact |
|---------|--------|
| 🤖 **AI-Powered** | Generate professional event descriptions in seconds |
| ⚡ **Real-time** | Live updates across all participant roles instantly |
| 🔒 **Enterprise Security** | Row-Level Security (RLS) and emergency SOS systems |
| 📱 **Mobile-First** | QR passes, crowd maps, instant ordering anywhere |
| 📊 **Analytics** | Real-time dashboards with engagement metrics |

---

## 💎 Key Features

### 🎓 Admin Control Room
- ✅ **AI Event Generation** - Auto-generate professional event descriptions using Google Gemini AI
- ✅ **Real-time Dashboard** - Live participant tracking and instant schedule updates
- ✅ **Vendor Management** - Manage stalls, orders, and inventory
- ✅ **Security & SOS** - Row-Level Security and dedicated emergency system
- ✅ **Analytics** - Event metrics and attendance tracking
- ✅ **Bulk Operations** - Manage multiple events simultaneously

### 🎯 Participant Experience
- ✅ **Dynamic QR Passes** - Instantly generated, secure entry passes
- ✅ **Live Schedule** - Real-time event updates and crowd density maps
- ✅ **Mobile Ordering** - Order food/services directly from your phone
- ✅ **Personalized Dashboard** - View assigned seats, contacts, and schedules
- ✅ **Push Notifications** - Stay updated on announcements and changes

### 🏪 Vendor/Stall Management
- ✅ **Live Order Tracking** - Real-time order management with status updates
- ✅ **Digital Presence** - Manage profiles, menus, and inventory
- ✅ **Event Announcements** - Receive critical coordination messages
- ✅ **Sales Analytics** - Track orders, popular items, and peak times

---

## 🛠️ Tech Stack

### Frontend (91.3% JavaScript)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI component framework |
| **Vite** | 5.4.10 | Lightning-fast bundler |
| **TypeScript** | 2.7% | Type-safe JavaScript |
| **Tailwind CSS** | 3.4.14 | Utility-first styling |
| **Framer Motion** | 11.11.11 | Animations & transitions |
| **React Router** | 6.27.0 | Client-side routing |
| **Zustand** | 5.0.0 | State management |
| **TanStack Query** | 5.59.0 | Server state management |
| **Recharts** | 2.13.0 | Data visualization |

### Backend & Database (5.6% PLpgSQL)

| Technology | Purpose | Version |
|------------|---------|---------|
| **Supabase** | PostgreSQL & Auth | 2.49.4 |
| **Firebase** | Hosting & Functions | 11.0.1 |
| **Google Gemini AI** | AI capabilities | 0.17.1 |
| **Razorpay** | Payment gateway | 2.9.4 |

### Additional Tools
- **html5-qrcode** (v2.3.8) - QR code scanning
- **QRCode.react** (v4.2.0) - QR code generation
- **i18next** (v24.0.2) - Internationalization
- **Lucide React** - Icon library
- **Vite PWA Plugin** - Progressive Web App support

### Database Architecture
- **PostgreSQL** with Supabase
- **Row-Level Security (RLS)** for data protection
- **Real-time API** for live updates
- **Edge Functions** for serverless backend

---

## 📋 Prerequisites

### System Requirements
```bash
✓ Node.js 16.0.0+ (v20+ recommended)
✓ npm 8.0.0+ or yarn 1.22.0+
✓ Git 2.37.0+
```

### Verify Installation
```bash
node --version    # Should output v16.0.0 or higher
npm --version     # Should output 8.0.0 or higher
git --version     # Should output 2.37.0 or higher
```

### Required Accounts
- 🔵 **Supabase** - https://supabase.com (PostgreSQL database)
- 🔥 **Firebase** - https://firebase.google.com (Hosting & Functions)
- 🤖 **Google Gemini API** - https://ai.google.dev (AI features)
- 💳 **Razorpay** - https://razorpay.com (Payments) - Optional

---

## 📁 Project Structure

```
smartvenue/
│
├── 📂 src/
│   ├── 📂 components/               # React components
│   │   ├── 📂 auth/                 # Login, signup components
│   │   ├── 📂 events/               # Event management UI
│   │   ├── 📂 participants/         # Participant interface
│   │   ├── 📂 vendors/              # Vendor dashboard
│   │   └── 📂 common/               # Buttons, modals, headers
│   │
│   ├── 📂 pages/                    # Page components
│   │   ├── AdminDashboard.jsx       # Admin control room
│   │   ├── ParticipantHub.jsx       # Participant experience
│   │   ├── VendorStall.jsx          # Vendor dashboard
│   │   └── LoginPage.jsx            # Authentication page
│   │
│   ├── 📂 hooks/                    # Custom React hooks
│   │   ├── useAuth.js               # Authentication logic
│   │   ├── useEvent.js              # Event management
│   │   └── useParticipant.js        # Participant data
│   │
│   ├── 📂 utils/                    # Helper functions
│   │   ├── supabaseClient.js        # Supabase setup
│   │   ├── firebaseConfig.js        # Firebase config
│   │   ├── geminiAPI.js             # AI integration
│   │   └── validators.js            # Form validation
│   │
│   ├── 📂 services/                 # API service layer
│   │   ├── eventService.js          # Event APIs
│   │   ├── authService.js           # Auth APIs
│   │   └── participantService.js    # Participant APIs
│   │
│   ├── 📂 store/                    # Zustand state
│   │   ├── authStore.js
│   │   ├── eventStore.js
│   │   └── uiStore.js
│   │
│   ├── 📂 styles/                   # Global styles
│   │   └── globals.css              # Tailwind imports
│   │
│   ├── App.jsx                      # Root component
│   └── main.jsx                     # Entry point
│
├── 📂 functions/                    # Firebase Cloud Functions
│   ├── 📂 src/
│   │   ├── index.js                 # Function exports
│   │   ├── 📂 payment/              # Payment processing
│   │   ├── 📂 notifications/        # Push notifications
│   │   └── 📂 emails/               # Email service
│   │
│   └── package.json
│
├── 📂 public/                       # Static assets
│   ├── favicon.ico
│   └── manifest.json
│
├── .env.local                       # Local env vars (not in git)
├── .env.example                     # Template for env vars
├── vite.config.js                   # Vite config
├── tailwind.config.js               # Tailwind config
├── package.json                     # Dependencies
├── eslint.config.js                 # Linting rules
└── README.md                        # This file
```

---

## 🚀 Installation

### Step 1️⃣: Clone Repository
```bash
git clone https://github.com/aletirajenderreddy/smartvenue.git
cd smartvenue
```

### Step 2️⃣: Install Dependencies
```bash
npm install

# For Firebase Functions (optional):
cd functions && npm install && cd ..
```

### Step 3️⃣: Create Environment File
Create `.env.local` in project root:

```env
# 🔵 Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 🤖 Google Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# 🔥 Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# 💳 Razorpay (Optional)
VITE_RAZORPAY_KEY_ID=your_razorpay_key

# ⚙️ App Config
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
```

### Step 4️⃣: Verify Setup
```bash
npm run deploy-check
```

### Step 5️⃣: Start Development Server
```bash
npm run dev
```

✅ App running at **http://localhost:5173**

### Step 6️⃣: Verify Installation
- ✅ Dev server starts without errors
- ✅ Login page loads
- ✅ No console errors
- ✅ Supabase connected

---

## 🔧 Environment Setup

### Getting API Keys

#### 🔵 Supabase Setup
1. Go to [supabase.com](https://supabase.com) → Create Project
2. Settings → API → Copy `Project URL` and `anon public key`
3. Paste into `.env.local`

#### 🤖 Google Gemini API
1. Visit [ai.google.dev](https://ai.google.dev)
2. Click "Get API Key" → Create new key
3. Copy key to `.env.local`

#### 🔥 Firebase Setup
1. Go to [firebase.google.com](https://firebase.google.com)
2. Create Project → Project Settings
3. Copy all config values
4. Enable: Hosting, Functions, Realtime Database

#### 💳 Razorpay Setup
1. Sign up at [razorpay.com](https://razorpay.com)
2. Settings → API Keys → Copy Key ID
3. Store Key Secret securely (backend only)

---

## 📖 Usage Guide

### 👨‍💼 For Event Organizers (Admin)

#### Create Event
1. Log into Admin Dashboard
2. Click **"New Event"**
3. Fill event details (name, date, venue, capacity)
4. Click **"Generate with AI"** for description
5. Configure participant roles
6. Set up vendors/stalls
7. **Publish Event**

#### Monitor Live Event
- 📊 Live participant check-ins
- 🗺️ Crowd density heat map
- 🏪 Vendor stall management
- 📢 Send announcements
- 🆘 View SOS alerts

### 👤 For Participants

#### Join Event
1. Open app → Select event
2. Verify with event code
3. Generate QR pass
4. View schedule & venue map
5. Browse vendors & order food

#### During Event
- 📍 Real-time schedule updates
- 🗺️ Crowd density recommendations
- 🍔 Order food/services
- 📞 Access emergency contacts

### 🏪 For Vendors

#### Setup Stall
1. Log into Vendor Dashboard
2. Complete stall profile
3. Add menu items & pricing
4. Set inventory
5. Enable notifications

#### Manage Orders
- 🔔 Real-time order notifications
- ✏️ Update order status
- 📊 Track daily sales
- 📦 Manage inventory

---

## 🔌 API Documentation

### Authentication
```javascript
const { data: { session } } = await supabase.auth.getSession();
// Use token: Authorization: Bearer {token}
```

### Get All Events
```javascript
const { data, error } = await supabase
  .from('events')
  .select('*')
  .eq('status', 'active');
```

### Create Event
```javascript
const { data, error } = await supabase
  .from('events')
  .insert([{ 
    name: 'Tech Conference',
    date: '2024-05-15',
    venue: 'Convention Center',
    capacity: 1000
  }]);
```

### Get Participants
```javascript
const { data, error } = await supabase
  .from('participants')
  .select('*')
  .eq('event_id', eventId);
```

### Real-time Updates
```javascript
supabase
  .from('participants')
  .on('*', payload => console.log('Update:', payload))
  .subscribe();
```

---

## 🌐 Deployment

### Deploy to Firebase Hosting

#### Prerequisites
```bash
npm install -g firebase-tools
firebase login
```

#### Deploy Steps
```bash
# Build project
npm run build

# Deploy
firebase deploy

# View site
firebase open hosting:site
```

#### Production Environment
Update `.env.production`:
```env
VITE_SUPABASE_URL=https://prod.supabase.co
VITE_APP_ENV=production
VITE_APP_URL=https://your-domain.com
```

---

## 🤝 Contributing

### Branch Naming
```bash
feature/add-notification-system
bugfix/fix-login-error
hotfix/critical-security-patch
refactor/improve-performance
docs/update-readme
```

### Commit Format
```bash
git commit -m "feat: add real-time notifications"
git commit -m "fix: resolve QR code generation"
git commit -m "docs: update API docs"
```

### Code Style
```bash
npm run lint          # Check code
npm run lint -- --fix # Fix issues
npm run format        # Format code
```

### Pull Request Steps
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request
6. Wait for approval
7. Merge to main

---

## 🐛 Troubleshooting

### ❌ Supabase Connection Failed
**Solution:**
```bash
# Check environment variables
echo $VITE_SUPABASE_URL

# Verify Supabase project is active
# Go to supabase.com dashboard → Check project status
```

### ❌ Vite Port Already in Use
**Solution:**
```bash
# Use different port
npm run dev -- --port 5174

# Or kill existing process:
lsof -ti:5173 | xargs kill -9
```

### ❌ AI Generation Not Working
**Solution:**
```bash
# Verify API key is correct
# Check Google Cloud Console quota limits
# Ensure Generative Language API is enabled
```

### ❌ QR Code Not Generating
**Solution:**
```bash
npm install --save qrcode qrcode.react
# Check canvas element is rendered
```

### ❌ Firebase Deployment Error
**Solution:**
```bash
firebase login
firebase init hosting
firebase deploy --debug
```

---

## 📄 License

MIT License © 2024 SmartVenueX

Permission is hereby granted to use, modify, and distribute this project.

---

## 📞 Support & Links

- 🐛 [Report Issues](https://github.com/aletirajenderreddy/smartvenue/issues)
- 💬 [Discussions](https://github.com/aletirajenderreddy/smartvenue/discussions)
- 📧 Email: support@smartvenue.com
- 🌐 [Live Demo](https://smartvenue-app.web.app)

---

## 🙏 Acknowledgments

Built with ❤️ using:
- [React](https://react.dev) - UI Framework
- [Supabase](https://supabase.com) - Backend
- [Firebase](https://firebase.google.com) - Hosting
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Google Gemini](https://ai.google.dev) - AI

---

**Last Updated**: April 19, 2026 | **Version**: 1.0.0 | **Status**: ✨ Production Ready

Made with 💜 by [aletirajenderreddy](https://github.com/aletirajenderreddy)