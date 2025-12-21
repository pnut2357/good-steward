# Phase 1: Dependencies & Setup (Refined)

## 🎯 Goal
Install all required packages and create the folder structure.

---

## Current Expo Version
The project uses **Expo SDK 54** with React Native 0.81.5 (as per package.json).

---

## Step 1.1: Install Core Dependencies

```bash
# Navigate to project directory
cd /Users/j0c0p72/Projects/good-steward

# Camera for barcode scanning AND photo capture
npx expo install expo-camera

# SQLite for local database (synchronous API)
npx expo install expo-sqlite

# File system for image handling (photo mode)
npx expo install expo-file-system

# AI SDK (works in React Native with dangerouslyAllowBrowser)
npm install groq-sdk

# HTTP client for OpenFoodFacts API
npm install axios
```

### Package Versions (Expected)

| Package | Version | Purpose |
|---------|---------|---------|
| expo-camera | ~16.x | Barcode scanning + Photo capture |
| expo-sqlite | ~15.x | Local SQLite database |
| expo-file-system | ~18.x | Image to base64 for vision AI |
| groq-sdk | ^0.5.x | Groq AI (text + vision models) |
| axios | ^1.6.x | HTTP client for API calls |

---

## Step 1.2: Create Folder Structure

```bash
# Create services folder (singleton classes)
mkdir -p services

# Create models folder (TypeScript interfaces)
mkdir -p models
```

---

## Step 1.3: Create Empty Files

```bash
# Models
touch models/ScanResult.ts

# Services
touch services/DatabaseService.ts
touch services/AnalysisService.ts

# Components (new ones for the scanner)
touch components/ScannerOverlay.tsx
touch components/PhotoOverlay.tsx
touch components/ModeToggle.tsx
touch components/ResultModal.tsx
touch components/HistoryItem.tsx

# New screen for history
touch app/\(tabs\)/history.tsx
```

---

## Step 1.4: Create Environment File

Create `.env` in project root:

```env
# Groq AI API Key
# Get yours at: https://console.groq.com/keys
EXPO_PUBLIC_GROQ_API_KEY=gsk_your_api_key_here
```

### Getting Your Groq API Key

1. Go to https://console.groq.com
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create API Key"
5. Copy the key (starts with `gsk_`)
6. Paste into `.env` file

---

## Step 1.5: Update .gitignore

Add to `.gitignore` to protect API keys:

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Expo
.expo/

# SQLite database (optional - you may want to keep for development)
*.db
```

---

## Step 1.6: Verify Installation

Run these commands to verify packages installed correctly:

```bash
# Check installed packages
npm list expo-camera expo-sqlite groq-sdk axios

# Start the app to verify no errors
npx expo start
```

---

## Expected Folder Structure After Phase 1

```
good-steward/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx    ← Existing
│   │   ├── index.tsx      ← Existing (will replace)
│   │   ├── about.tsx      ← Existing (will update)
│   │   └── history.tsx    ← NEW
│   ├── _layout.tsx        ← Existing
│   └── +not-found.tsx     ← Existing
├── components/
│   ├── ... existing components ...
│   ├── ScannerOverlay.tsx ← NEW (empty)
│   ├── ResultModal.tsx    ← NEW (empty)
│   └── HistoryItem.tsx    ← NEW (empty)
├── services/               ← NEW folder
│   ├── DatabaseService.ts ← NEW (empty)
│   └── AnalysisService.ts ← NEW (empty)
├── models/                 ← NEW folder
│   └── ScanResult.ts      ← NEW (empty)
├── .env                   ← NEW
└── package.json           ← Updated with new dependencies
```

---

## Compatibility Notes

### expo-camera (SDK 54)
- Uses `CameraView` component (not the older `Camera`)
- `barcodeScannerSettings` prop for barcode types
- `onBarcodeScanned` callback for detection

### expo-sqlite (SDK 54)
- Uses `openDatabaseSync` (synchronous API)
- Methods: `execSync`, `runSync`, `getAllSync`, `getFirstSync`
- Database stored at app-specific location

### groq-sdk
- Requires `dangerouslyAllowBrowser: true` for React Native
- Uses environment variable `EXPO_PUBLIC_GROQ_API_KEY`
- JSON mode: `response_format: { type: 'json_object' }`

---

## ✅ Checklist

- [ ] `expo-camera` installed
- [ ] `expo-sqlite` installed
- [ ] `groq-sdk` installed
- [ ] `axios` installed
- [ ] `services/` folder created
- [ ] `models/` folder created
- [ ] `services/DatabaseService.ts` file created (empty)
- [ ] `services/AnalysisService.ts` file created (empty)
- [ ] `models/ScanResult.ts` file created (empty)
- [ ] `components/ScannerOverlay.tsx` file created (empty)
- [ ] `components/ResultModal.tsx` file created (empty)
- [ ] `components/HistoryItem.tsx` file created (empty)
- [ ] `app/(tabs)/history.tsx` file created (empty)
- [ ] `.env` file created with `EXPO_PUBLIC_GROQ_API_KEY`
- [ ] `.gitignore` updated to exclude `.env`
- [ ] App starts without errors

---

## 🔜 Next: Phase 2 - Data Model
