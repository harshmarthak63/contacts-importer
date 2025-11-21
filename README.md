# Contacts Importer

A full-stack contact management system with intelligent field mapping, built with Next.js 14, TypeScript, Firebase, and Redux. Features AI-powered field mapping using Mistral AI for enhanced accuracy.

## Features

### Core Features

- **Smart Import & Field Mapping**
  - Upload CSV and Excel (.xlsx, .xls) files
  - Two mapping modes:
    - **Regular Mapping**: Auto-suggest field mappings based on header similarity and data pattern detection
    - **AI-Powered Mapping**: Leverage Mistral AI for intelligent field mapping with higher accuracy
  - Manual override of mappings before import
  - Agent email mapping to user UIDs
  - Deduplication by phone or email (merges existing contacts)
  - Import summary with created/merged/skipped counts
  - Real-time progress indicators and loading animations
  - Three-step import process: Detect Fields → Map Fields → Final Checks

- **Users Management**
  - Add, edit, and delete users
  - User designations: Agent, Sales, Developer, HR
  - Automatic agent ID generation for users with "Agent" designation
  - Users are used for agent assignment during contact import
  - Agent deletion automatically removes assignments from contacts

- **Contacts Management**
  - Full CRUD operations (Create, Read, Update, Delete)
  - Dynamic grid with all core and custom fields as columns
  - Search by phone, email, name, or agent
  - Filter by phone, email, or agent
  - Agent assignment to contacts
  - Shows assigned agent names (resolved from UID)
  - Responsive table with vertical scrolling

- **Contact Fields Management**
  - View, add, edit, and delete custom contact fields
  - Core fields (First Name, Last Name, Phone, Email, Agent) are protected
  - Field types: text, number, phone, email, datetime
  - Core fields cannot be edited or deleted
  - Custom fields automatically appear in contacts grid
  - Real-time updates across the application

- **Modern UI/UX**
  - Responsive design for mobile and desktop
  - Collapsible sidebar navigation
  - Smooth animations and transitions
  - Modal dialogs for forms and confirmations
  - Clean, professional interface

## Tech Stack

- **Framework**: Next.js 14 (App Router) with React 18 & TypeScript
- **State Management**: Redux Toolkit with React Redux
- **Backend**: Firebase Firestore
- **AI Integration**: Mistral AI for intelligent field mapping
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **File Parsing**: 
  - `xlsx` for Excel files
  - `papaparse` for CSV files
- **Utilities**: 
  - `clsx` & `tailwind-merge` for conditional styling

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/contacts-importer.git
cd contacts-importer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
MISTRAL_API_KEY=your_mistral_api_key
```

**Note**: The Firebase config has fallback values in `lib/firebase/config.ts` for development, but you should set up your own Firebase project for production.

### 4. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database:
   - Navigate to **Firestore Database** in the left sidebar
   - Click **Create Database**
   - Choose **Start in test mode** (for development) or set up custom rules
   - Select a location for your database
3. Copy your Firebase configuration to `.env.local`

### 5. Firestore Security Rules

Set up Firestore security rules in Firebase Console → Firestore Database → Rules:

**For Development:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /company/{companyId}/{document=**} {
      allow read, write: if true;
    }
  }
}
```

**For Production (with Authentication):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /company/{companyId}/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Important**: The app uses subcollections under `/company/default/`, so rules must allow access to this path.

### 6. Mistral AI Setup (Optional)

For AI-powered field mapping:
1. Sign up at [Mistral AI](https://mistral.ai/)
2. Get your API key
3. Add it to `.env.local` as `MISTRAL_API_KEY`
4. If not configured, the app will fall back to regular mapping

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 8. Build for Production

```bash
npm run build
npm start
```

## Data Model

The application uses the following Firestore structure:

```
/company/{companyId}
  /contacts
    - id (doc id)
    - firstName (string)
    - lastName (string)
    - phone (string)
    - email (string)
    - agentUid (string, optional)
    - createdOn (timestamp)
    - ...custom fields (dynamic)
  /contactFields
    - id (doc id)
    - label (string)
    - type (text | number | phone | email | datetime)
    - core (boolean)
  /users
    - uid (doc id)
    - name (string)
    - email (string)
    - designation (Agent | Sales | Developer | HR)
    - agentId (string, optional - only for Agents)
```

## Usage

### Managing Users

1. Navigate to "Users" page (default landing page)
2. Click "Add User" to create a new user
3. Select designation (Agent, Sales, Developer, HR)
4. Agent ID is automatically generated for users with "Agent" designation
5. Edit or delete users using the toolbar buttons
6. Deleting an agent automatically removes their assignments from contacts

### Importing Contacts

1. Navigate to "Contacts" page
2. Click "Import Contacts" (regular mapping) or "Import using AI" (AI-powered mapping)
3. Upload a CSV or Excel file
4. Review and adjust the auto-suggested field mappings
5. Map file columns to CRM fields (core and custom)
6. Review final checks and import summary
7. Click "Move to Contacts" to complete import

### Managing Contacts

1. Navigate to "Contacts" page
2. Use search bar to find contacts by phone, email, name, or agent
3. Apply filters to narrow down results
4. Click "Add Contact" to manually create a contact
5. Edit or delete contacts using the toolbar buttons
6. Assign agents to contacts during creation or editing

### Managing Contact Fields

1. Navigate to "Contact Fields" page
2. View all core and custom fields
3. Click "Add Field" to create a new custom field
4. Select field type (text, number, phone, email, datetime)
5. Edit or delete custom fields (core fields are protected)
6. Custom fields automatically appear in contacts grid

## Project Structure

```
contacts-importer/
├── app/
│   ├── api/
│   │   └── ai-mapping/
│   │       └── route.ts          # Mistral AI mapping API
│   ├── contacts/
│   │   └── page.tsx              # Contacts management page
│   ├── fields/
│   │   └── page.tsx              # Contact fields management
│   ├── users/
│   │   └── page.tsx              # Users management page
│   ├── layout.tsx                # Root layout with navigation
│   ├── page.tsx                  # Home page (redirects to users)
│   └── globals.css               # Global styles
├── components/
│   ├── ImportModal.tsx           # Import flow modal with field mapping
│   ├── Stepper.tsx               # Multi-step progress indicator
│   ├── AppInitializer.tsx        # Firebase initialization
│   ├── Header.tsx                # Top navigation bar
│   ├── Sidebar.tsx               # Left navigation menu
│   ├── MainContent.tsx          # Main content wrapper
│   ├── LayoutClient.tsx          # Client-side layout wrapper
│   └── ReduxProvider.tsx         # Redux store provider
├── lib/
│   ├── firebase/
│   │   ├── config.ts             # Firebase configuration
│   │   ├── services.ts           # Firestore CRUD operations
│   │   └── init.ts               # Initialize core fields
│   ├── store/
│   │   ├── index.ts              # Redux store configuration
│   │   ├── hooks.ts              # Typed Redux hooks
│   │   ├── slices/
│   │   │   ├── sidebarSlice.ts   # Sidebar state
│   │   │   ├── usersSlice.ts     # Users state
│   │   │   ├── contactsSlice.ts  # Contacts state
│   │   │   └── fieldsSlice.ts    # Contact fields state
│   │   └── selectors/
│   │       └── contactsSelectors.ts  # Memoized selectors
│   ├── file-parser.ts            # CSV/Excel parsing
│   ├── field-mapping.ts          # Smart mapping algorithms
│   └── utils.ts                  # Utility functions
├── types/
│   └── index.ts                  # TypeScript type definitions
└── package.json
```

## Smart Field Mapping

The system offers two mapping approaches:

### Regular Mapping
1. **Header Similarity Matching**: Compares file column headers with system field labels using string similarity
2. **Data Pattern Detection**: Analyzes sample data to detect patterns (email, phone, number, datetime)

### AI-Powered Mapping (Mistral AI)
- Uses Mistral AI's `mistral-medium-latest` model
- Analyzes CSV structure and sample data
- Maps columns to internal CRM fields with high accuracy
- Falls back to regular mapping if AI fails

Both methods assign confidence scores, and users can manually override any suggestion.

## State Management

The application uses Redux Toolkit for centralized state management:
- **Sidebar State**: Controls sidebar visibility
- **Users State**: Manages users data and operations
- **Contacts State**: Manages contacts data, filters, and operations
- **Fields State**: Manages contact fields data and operations

All state updates are synchronized with Firebase Firestore in real-time.

## Key Features

- ✅ Full CRUD operations for users, contacts, and fields
- ✅ AI-powered field mapping with Mistral AI
- ✅ Responsive design for mobile and desktop
- ✅ Real-time data synchronization with Firebase
- ✅ Dynamic grid columns based on custom fields
- ✅ Agent assignment and management
- ✅ Deduplication during import
- ✅ Search and filter functionality
- ✅ Modal dialogs for better UX
- ✅ Clean, production-ready codebase

## Notes

- Core fields (First Name, Last Name, Phone, Email, Agent) are automatically created and cannot be deleted
- Contacts are deduplicated by phone OR email (if either matches, the contact is merged)
- Agent assignment requires the agent's email to exist in the users collection
- The system automatically initializes core fields on first load
- Deleting an agent removes their assignment from all contacts
- Custom fields automatically appear in the contacts grid
- All operations are persisted to Firebase Firestore

## License

MIT
