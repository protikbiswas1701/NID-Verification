# NID Verify — Frontend

React 19 + Vite 8 + Tailwind CSS client for the Bangladesh National ID (NID) Fraud Detection and Verification platform.

## Quick Start
```bash
cd frontend
npm install
npm run dev              # starts dev server at http://localhost:5173
npm run build            # creates optimized production bundle in dist/
```

## Features
- **NID Card Upload & Camera Capture**: Upload from device gallery or capture live via device camera with card framing guidelines.
- **Pre-configured Sample Card Presets**: Test real genuine cards vs. 4 different fraud/forgery scenarios with a single click.
- **Comprehensive Authenticity Report**:
  - Visual verdict banner with confidence score progress bar
  - Detected fraud & tampering indicators
  - Extracted NID credentials (NID number, DOB, Name, Blood Group) with one-click copy
  - National Citizen Registry match details (registered DOB, masked phone number)
  - Security checklist breakdown (NID format, 17-digit checksum, ELA forensics, image quality)
- **Re-Analyze Capability**: Run on-demand re-evaluations directly from the detail view.
- **Admin Review Workflow**: Search, filter, and review submissions across all users with manual status overrides and notes.
- **Private Image Display**: Fetches secure card images via authenticated blob requests (`SecureImage`).

## Project Layout
```
src/
  components/
    VerificationReport.jsx   # Detailed fraud analysis & security checks card
    DocumentCard.jsx         # Private card preview card with secure blob loader
    NidImageInput.jsx        # Dual-mode file upload & camera capture
    StatusBadge.jsx          # Color-coded status badge for verdicts and workflow
    ...
  pages/
    Landing.jsx              # Product landing page with fraud detection features
    Upload.jsx               # Upload screen with quick-pick sample presets
    Dashboard.jsx            # User metrics, fraud alerts & recent verifications
    History.jsx              # Paginated list of user submissions with NID previews
    Details.jsx              # Authenticity report & submitted images
    admin/
      AdminDashboard.jsx     # Global metrics across all users
      AdminVerifications.jsx # Searchable & filterable submission review list
      AdminVerificationDetails.jsx # In-depth admin review & manual status override
```
