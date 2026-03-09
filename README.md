# ARI Dashboard - Project Documentation

## Project Overview

ARI Dashboard is a web-based inventory management system for aerospace rocket components. Built with React, TypeScript, and Firebase, it provides real-time inventory tracking, user authentication, item checkout/return functionality, and CSV import capabilities.

## Tech Stack

- **Framework**: React 18.3.1
- **Language**: TypeScript 5.6.2
- **Build Tool**: Vite 5.4.8
- **Styling**: TailwindCSS 3.4.13
- **Database**: Firebase Firestore 10.13.2
- **Authentication**: Firebase Authentication 10.13.2
- **Routing**: React Router 6.26.2

## File Structure

```
ari-dashboard/
├── index.html                         # Application entry point
├── package.json                       # Dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
├── tsconfig.node.json                 # TypeScript for build tools
├── vite.config.ts                     # Vite build configuration
├── tailwind.config.js                 # TailwindCSS configuration
├── postcss.config.js                  # PostCSS configuration
├── .eslintrc.cjs                      # ESLint rules
├── .gitignore                         # Git exclusions
├── FILE_TREE.md                       # This file
│
└── src/
    ├── main.tsx                       # React initialization
    ├── App.tsx                        # Root component with routing
    ├── index.css                      # Global styles
    ├── vite-env.d.ts                  # Vite types
    │
    ├── components/
    │   ├── Header.tsx                 # Navigation bar with menu
    │   ├── Sidebar.tsx                # Filter sidebar
    │   ├── SearchBar.tsx              # Debounced search
    │   ├── ItemsTable.tsx             # Inventory table
    │   ├── ItemDetailPanel.tsx        # Item details and checkout
    │   ├── NewItemModal.tsx           # Create item modal
    │   ├── CSVImportModal.tsx         # CSV import interface
    │   ├── ProtectedRoute.tsx         # Auth guard
    │   ├── InventoryView.tsx          # Inventory interface
    │   ├── ProfileView.tsx            # Profile interface
    │   ├── ProfileHeader.tsx          # Profile header
    │   ├── CheckedOutList.tsx         # Checked out items
    │   ├── ItemDetailsModal.tsx       # Item modal
    │   └── QRCodeModal.tsx            # QR code display
    │
    ├── pages/
    │   ├── AuthPage.tsx               # Login page
    │   └── MainPage.tsx               # Main container
    │
    ├── contexts/
    │   ├── AuthContext.tsx            # Auth state
    │   └── ThemeContext.tsx           # Theme state
    │
    ├── hooks/
    │   └── useItems.ts                # Items state and filtering
    │
    ├── services/
    │   ├── firebase.ts                # Firebase init
    │   ├── auth.ts                    # Auth operations
    │   ├── itemsRepository.ts         # Item CRUD
    │   ├── checkoutService.ts         # Checkout transactions
    │   ├── returnService.ts           # Return transactions
    │   └── profileService.ts          # Profile data
    │
    ├── types/
    │   └── item.ts                    # TypeScript interfaces
    │
    └── utils/
        └── helpers.ts                 # Utility functions
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Starts Vite dev server on http://localhost:5173

## Build

```bash
npm run build
```

Compiles to dist/ directory

## Configuration

Create .env file:
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender
VITE_FIREBASE_APP_ID=your_app_id
```

## Features

- Real-time inventory sync
- Advanced filtering
- Item checkout/return
- CSV bulk import
- QR code generation
- Dark/light mode
- Responsive design
- Transaction-based updates
