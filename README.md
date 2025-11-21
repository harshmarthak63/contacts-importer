# Contact Importer

A full-stack contact import system with smart field mapping, built with Next.js, TypeScript, and Firebase.

## Features

### Core Features

- **Smart Import & Field Mapping**
  - Upload CSV and Excel (.xlsx) files
  - Auto-suggest field mappings based on:
    - Header similarity (e.g., "mobile number" → phone)
    - Data pattern detection (e.g., email regex, phone patterns)
  - Manual override of mappings before import
  - Agent email mapping to user UIDs
  - Deduplication by phone or email (merges existing contacts)
  - Import summary with created/merged/skipped counts
  - Loading animations and progress indicators

- **Custom Fields Management**
  - View, add, edit, and delete custom contact fields
  - Core fields (firstName, lastName, phone, email, agentUid) are protected

- **User Management**
  - Add, edit, and delete users
  - Users are used for agent assignment during import

- **Contacts View**
  - Table view of all contacts
  - Search by phone, email, name, or agent
  - Filter by phone, email, or agent
  - Shows assigned agent names (resolved from UID)

## Tech Stack

- **Framework**: Next.js 14 with React & TypeScript
- **Backend**: Firebase Firestore
- **Styling**: Tailwind CSS
- **File Parsing**: 
  - `xlsx` for Excel files
  - `papaparse` for CSV files

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. ✅ Firebase project is already configured: `contacts-importer-db841`
2. Enable Firestore Database:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `contacts-importer-db841`
   - Navigate to **Firestore Database** in the left sidebar
   - Click **Create Database**
   - Choose **Start in test mode** (for development) or set up custom rules (see below)
   - Select a location for your database

3. ✅ Environment variables are already set in `.env.local` file

**Note**: The Firebase config is also hardcoded as fallback values in `lib/firebase/config.ts`, so the app will work even without `.env.local` for development.

### 3. Firestore Security Rules

Set up Firestore security rules in Firebase Console → Firestore Database → Rules:

**Option 1: Production Mode with Authentication (Recommended for real apps)**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow access to company subcollections only if authenticated
    match /company/{companyId}/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Option 2: Production Mode - Open for Development (Current setup)**
If you're not using Firebase Authentication yet but want production mode enabled:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all access - use only for development/testing
    // Replace with proper auth rules before deploying to production
    match /company/{companyId}/{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Option 3: Test Mode (Simplest for initial setup)**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Important Notes:**
- The app uses subcollections under `/company/default/`, so rules must allow access to this path
- **Test Mode** expires after 30 days and shows warnings
- **Production Mode** with `allow read, write: if true` works but is not secure - use only for development
- For real production, implement Firebase Authentication and use `request.auth != null`

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Data Model

The application uses the following Firestore structure:

```
/company/{companyId}
  /contacts
    - firstName (string)
    - lastName (string)
    - phone (string)
    - email (string)
    - agentUid (string, optional)
    - createdOn (timestamp)
    - ...custom fields
  /contactFields
    - id (doc id)
    - label (string)
    - type (text | number | phone | email | datetime)
    - core (boolean)
  /users
    - uid (doc id)
    - name (string)
    - email (string)
```

## Usage

### Importing Contacts

1. Navigate to the Import page (home page)
2. Upload a CSV or Excel file
3. Review and adjust the auto-suggested field mappings
4. Click "Import Contacts"
5. View the import summary

### Managing Custom Fields

1. Go to "Custom Fields" page
2. Click "Add Field" to create a new custom field
3. Edit or delete existing custom fields (core fields cannot be deleted)

### Managing Users

1. Go to "Users" page
2. Add users with name and email
3. These users can be assigned as agents during import

### Viewing Contacts

1. Go to "Contacts" page
2. Use the search bar to find contacts
3. Apply filters to narrow down results
4. View agent assignments and contact details

## Project Structure

```
contacts-importer/
├── app/
│   ├── page.tsx              # Import page
│   ├── contacts/
│   │   └── page.tsx          # Contacts view
│   ├── fields/
│   │   └── page.tsx          # Custom fields management
│   ├── users/
│   │   └── page.tsx          # Users management
│   ├── layout.tsx            # Root layout with navigation
│   └── globals.css           # Global styles
├── components/
│   ├── ImportModal.tsx       # Import flow modal with field mapping
│   ├── Stepper.tsx           # Multi-step progress indicator
│   ├── AppInitializer.tsx    # Firebase initialization
│   ├── Header.tsx            # Top navigation bar
│   ├── Sidebar.tsx           # Left navigation menu
│   ├── MainContent.tsx       # Main content wrapper
│   └── ReduxProvider.tsx    # Redux store provider
├── lib/
│   ├── firebase/
│   │   ├── config.ts         # Firebase configuration
│   │   ├── services.ts       # Firestore operations
│   │   └── init.ts           # Initialize core fields
│   ├── file-parser.ts        # CSV/Excel parsing
│   ├── field-mapping.ts      # Smart mapping algorithm
│   └── utils.ts              # Utility functions
├── types/
│   └── index.ts              # TypeScript types
└── package.json
```

## Smart Field Mapping Algorithm

The system uses a two-pass algorithm:

1. **Header Similarity Matching**: Compares file column headers with system field labels using string similarity
2. **Data Pattern Detection**: Analyzes sample data to detect patterns (email, phone, number, datetime)

Mappings are assigned confidence scores, and users can manually override any suggestion.

## Notes

- Core fields (firstName, lastName, phone, email, agentUid) are automatically created and cannot be deleted
- Contacts are deduplicated by phone OR email (if either matches, the contact is merged)
- Agent assignment requires the agent's email to exist in the users collection
- The system automatically initializes core fields on first load

## License

MIT

