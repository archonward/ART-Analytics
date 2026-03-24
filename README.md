# ART Analytics

A full-stack stock analysis app with a React frontend and Express backend.

## What it does
- Accepts a stock ticker from the UI.
- Validates that the ticker is listed on NYSE.
- Reads a pre-generated private PDF named `<TICKER>.pdf`.
- Extracts text and sends it to OpenAI for an investor-friendly summary.
- Displays the AI summary in a futuristic aquatic-themed interface.

## Tech choices
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **PDF parsing:** `pdf-parse`
- **AI summarization:** OpenAI Responses API

## Keeping research PDFs private when repo is on GitHub
Do **not** commit PDFs. This project is configured to ignore them via `.gitignore`.

Recommended setup:
1. Keep PDFs in `backend/private-pdfs` for local development (already ignored).
2. In production, set `PDF_STORAGE_DIR` to a server path outside the repo.
3. Store files on private infrastructure (e.g., private S3 bucket, secured VM disk, or private object store).
4. Never place raw research files in `frontend/public` or any tracked path.

## Setup

```bash
npm install
cp backend/.env.example backend/.env
```

Then edit `backend/.env` and add your `OPENAI_API_KEY`.

Add PDF files like:
- `backend/private-pdfs/IBM.pdf`
- `backend/private-pdfs/KO.pdf`

## Run

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## API

### `GET /api/stock-summary?ticker=IBM`
Returns:
- ticker/company metadata
- AI summary generated from your private PDF

## Notes
- This app expects machine-readable PDFs (not image-only scans).
- NYSE validation uses Yahoo Finance quote metadata.
