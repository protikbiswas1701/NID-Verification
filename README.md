# Bangladesh National ID (NID) Card Verification & Fraud Detection System

An enterprise-grade, end-to-end full-stack verification and forensic analysis platform for Bangladesh National ID cards (Smart NID and Old Format). Features dual-language OCR, 113k-record citizen registry cross-matching, 17-digit birth year checksum validation, Error Level Analysis (ELA) tampering detection, 2D Barcode / PDF417 back-of-card verification, automated perspective correction & card extraction, and facial eKYC comparison.

---

## 🌟 Key Features

### 🔍 Multi-Engine Fraud Detection & Verification Pipeline
1. **Automated Perspective Correction & Bounding-Box Extraction**:
   - Python + OpenCV contour analysis automatically detects card corners, deskews, and performs a 4-point perspective warp into standard credit-card aspect ratio (1.586:1).
2. **Dual-Language OCR Engine**:
   - Tesseract.js (`eng+ben`) with custom Jimp image pre-processing (contrast normalization, adaptive binarization, noise filtering).
   - Extracts NID number, English name, Bengali name, Date of Birth, Father's Name, Mother's Name.
3. **113k Citizen Registry Cross-Matching**:
   - Instant in-memory lookup against official 113,331-record citizen database (`nidRegistry.json`).
   - Validates NID, DOB, and name consistency.
4. **17-Digit Birth Year Checksum Validation**:
   - Strict mathematical validation verifying that digits 1–4 of 17-digit NID numbers match the citizen's birth year.
5. **Digital Forensics — Error Level Analysis (ELA)**:
   - Resaves images at 95% JPEG quality and calculates differential compression artifacts.
   - High average error or concentrated localized variance flags cloned or digitally spliced text/photos.
6. **2D Barcode / PDF417 Back-of-Card Cross-Match**:
   - Scans back-of-card barcodes using `@zxing/library`.
   - Cross-verifies encoded biometric and metadata against front-card OCR extraction.
7. **Facial eKYC Biometric Comparison**:
   - Python OpenCV Haar Cascade face detection isolates portrait from NID card and compares against live selfie upload.
   - Computes multi-channel histogram correlation and normalized cross-correlation scores.
8. **Interactive 1.586:1 Canvas Card Cropper**:
   - Client-side manual cropping modal for edge cases or extreme rotation angles.

---

### 💼 Enterprise Capabilities
- **Batch ZIP Ingestion**: Upload a ZIP archive containing up to 30 NID scans (`POST /api/verifications/batch-zip`) with parallel processing and automated reporting.
- **PDF Verification Certificate**: One-click branded PDF certificate generation (jsPDF) with QR code, forensic breakdown, and digital verdict stamp.
- **CSV Audit Log Export**: One-click export of verification records and forensic indicators for compliance reporting.
- **Role-Based Access Control (RBAC)**: Secure JWT authentication separating regular users and administrator oversight.
- **Admin Dashboard**: Live statistics, fraud rate analytics, verdict breakdown charts, and deep-dive forensic inspection modals.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router v7, Lucide Icons, jsPDF, Axios |
| **Backend** | Node.js (ES Modules), Express 5, Mongoose, JWT, Multer, Jimp, Tesseract.js, `@zxing/library` |
| **Computer Vision** | Python 3.12, OpenCV 4.10, NumPy, Haar Cascade Classifiers |
| **Database** | MongoDB (with auto-fallback to embedded `mongodb-memory-server` for zero-setup development) |
| **DevOps** | Docker, Docker Compose, Multi-stage builds |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.10+ (with `opencv-python==4.10.0.84` and `numpy`)
- MongoDB (optional — an embedded in-memory database will run automatically if no local instance is found)

### 1. Setup Backend
```bash
cd backend
npm install
pip install opencv-python==4.10.0.84 numpy
cp .env.example .env
npm run seed:admin   # Seeds default admin: admin@nidverify.local / Admin123456!
npm run dev          # Starts API server on http://localhost:5000
```

### 2. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev          # Starts client on http://localhost:5173
```

### 3. Run Automated Tests
```bash
cd backend
node src/scripts/runTestSuite.mjs
```
*(All 18 tests cover OCR, checksum, registry, ELA forensics, barcode decoder, face comparison, and batch ZIP)*

---

## 🐳 Docker Deployment

Run the entire platform (Frontend, Backend, and MongoDB) with a single command:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## 🔒 Security & Privacy
- **Strict Private Uploads**: Uploaded NID cards and selfies are stored in non-public directories (`private_uploads/`) and accessible strictly through authenticated, signed streaming endpoints.
- **MIME & Magic-Byte Validation**: File signatures are verified on ingest to prevent polyglot file uploads.
- **Rate Limiting & Helmet**: API rate limiting and security headers are enforced across all endpoints.

---

## ⚖️ Disclaimer
This project is an independent document review, fraud detection, and biometric verification tool. It is not affiliated with or endorsed by the Bangladesh Election Commission.
