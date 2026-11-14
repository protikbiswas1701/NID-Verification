# NID Verify — Backend API

Express + MongoDB REST API for Bangladesh National ID (NID) document submission, OCR extraction,
national citizen registry cross-referencing, Error Level Analysis (ELA) tampering detection, and verification
decision engine.

> **Disclaimer:** This is an independent fraud-detection and document-review system for educational
> and development screening. It is **not** an official Bangladesh Election Commission or Government verification service.

## Core Capabilities
- **Automated Optical Character Recognition (OCR)** via `tesseract.js`: Extracts NID number, Date of Birth (DOB), Citizen Name, and Blood Group from card photos. Supports Bengali to English numeral normalization.
- **National Registry Matching**: Instant $O(1)$ lookup across 113,000+ real citizen records (`nidRegistry.json`).
- **Mathematical Integrity Validation**: 17-digit smart card birth-year checksum validation.
- **Digital Forensic Tampering Detection**: Error Level Analysis (ELA) using `jimp` to detect pixel-level compression artifacts and localized manipulation.
- **Categorized Fraud Verdicts**: `VERIFIED_GENUINE`, `SUSPECTED_FAKE`, `UNVERIFIED_UNREGISTERED`, or `INVALID_DOCUMENT`.
- **Zero-Config Database**: Auto-detects external MongoDB at `mongodb://127.0.0.1:27017/nid_verify`, with automatic fallback to persistent embedded MongoDB on port `27018`.
- **Private Image Security**: Uploaded documents receive random UUID filenames in `private_uploads/` and are never exposed via public static URLs.

## Requirements
- Node.js 20+
- (Optional) MongoDB 7+ (fallback embedded MongoDB starts automatically if none found)

## Setup
```bash
cd backend
npm install
# Configure your .env file
npm run seed:admin          # registers admin from ADMIN_* in .env
npm run dev                 # starts backend at http://localhost:5000
```
Health check: `GET http://localhost:5000/api/health`

## Environment Variables
| Variable | Purpose | Default |
|---|---|---|
| `PORT` | API port | `5000` |
| `CLIENT_URL` | Allowed CORS origins | `http://localhost:5173,http://localhost:5174` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/nid_verify` |
| `JWT_SECRET` | Secret key used to sign tokens | (required in `.env`) |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` |
| `UPLOAD_DIR` | Private upload directory | `private_uploads` |
| `MAX_FILE_SIZE_MB` | Per-image size limit | `5` |
| `ADMIN_NAME/EMAIL/PASSWORD` | Used for seeding admin account | (set in `.env`) |

## API Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register standard user |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/me` | User | Get current user profile |
| PUT | `/api/auth/password` | User | Change current password |
| POST | `/api/verifications` | User | Upload front (+ back) NID card image, triggers automatic fraud verification |
| GET | `/api/verifications` | User | List user's verification submissions (supports search & pagination) |
| GET | `/api/verifications/stats` | User | User metrics: total, completed, manual review, and breakdown by verdict |
| GET | `/api/verifications/:id` | Owner/Admin | Get single verification details with full AI analysis report |
| POST | `/api/verifications/:id/analyze` | Owner/Admin | Re-run OCR, database matching, and forensics on uploaded card |
| GET | `/api/verifications/:id/files/:side` | Owner/Admin | Stream private card image (`front` or `back`) |
| DELETE | `/api/verifications/:id` | Owner | Delete request and permanently remove uploaded images |
| GET | `/api/admin/dashboard` | Admin | Overall system stats across all users |
| GET | `/api/admin/users`, `/:id` | Admin | List / inspect user accounts |
| PATCH | `/api/admin/users/:id/status` | Admin | Activate / deactivate user account |
| GET | `/api/admin/verifications` | Admin | Search and inspect all user submissions |
| POST | `/api/admin/verifications/:id/analyze` | Admin | Re-run verification pipeline on any submission |
| PATCH | `/api/admin/verifications/:id/status` | Admin | Manually override verification status and leave reviewer notes |

## Verification Engine Architecture
```
User Image Upload
       │
       ▼
1. Validation (File Signature / Magic bytes & MIME check)
       │
       ▼
2. OCR Extraction (Tesseract.js)
   - NID Number (10, 13, or 17 digits)
   - Date of Birth (normalized to YYYY-MM-DD)
   - Name & Blood Group
       │
       ▼
3. Digital Forensics (Jimp)
   - Error Level Analysis (ELA score & tampering threshold)
   - Aspect ratio, sharpness, and brightness checks
       │
       ▼
4. National Registry Cross-Verification (nidRegistry.json)
   - 113,331 records checked in O(1) time
   - Validates NID existence & DOB match
       │
       ▼
5. 17-Digit Checksum Rule (birth year prefix match)
       │
       ▼
6. Scored Authenticity Report & Final Verdict
   (VERIFIED_GENUINE, SUSPECTED_FAKE, or UNVERIFIED_UNREGISTERED)
```
