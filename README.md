# ART Analytics

A full-stack web application for exploring curated equity research summaries, providing structured insights, coverage tracking, and internal diagnostics through a modern, responsive interface.

---

## Overview

ART Analytics is designed to deliver **clear, structured stock research summaries** through a centralized platform. It combines a React-based frontend with a Node.js backend to serve curated financial insights, enabling users to quickly access coverage data, validate research completeness, and retrieve standardized report templates.

The system emphasizes **data consistency, modular architecture, and scalable deployment**, making it suitable for both analytical workflows and portfolio tracking extensions.

---

## Features

### Core Functionality

* Search and retrieve **curated stock research summaries**
* View **coverage universe** of supported tickers
* Access structured **report templates**
* Perform **internal diagnostics and audit checks** on available reports

### System Capabilities

* RESTful API endpoints for research retrieval and validation
* Centralized data handling for published reports
* Environment-based configuration for deployment flexibility
* Cross-origin communication between frontend and backend

---

## Tech Stack

### Frontend

* React (Vite)
* JavaScript (ES Modules)
* CSS for styling
* Hosted on **Vercel**

### Backend

* Node.js
* Express.js
* Modular service-layer architecture
* Hosted on **Render**

---

## Architecture

```
Frontend (Vercel)
    ↓ API Requests (VITE_API_BASE)
Backend (Render)
    ↓
Services Layer
    ↓
Data Layer (JSON-based research reports)
```

### Key Backend Modules

* `services/` → business logic (report retrieval, validation)
* `data/` → coverage registry and report storage
* `utils/` → standardized response builders
* `server.js` → API routing and middleware

---

## API Endpoints

| Endpoint                        | Description                           |
| ------------------------------- | ------------------------------------- |
| `/api/coverage`                 | Returns list of covered tickers       |
| `/api/report-template`          | Returns standardized report structure |
| `/api/report-audit`             | Performs audit on available reports   |
| `/api/stock-summary?ticker=XXX` | Returns research summary for a ticker |

---

## Environment Variables

### Backend (Render)

```env
PORT=4000
FRONTEND_ORIGIN=https://your-frontend.vercel.app
OPENAI_API_KEY=your_key (optional)
OPENAI_MODEL=gpt-4.1-mini
```

### Frontend (Vercel)

```env
VITE_API_BASE=https://your-backend.onrender.com
```

---

## Local Development

### 1. Clone Repository

```bash
git clone https://github.com/archonward/ART-Analytics.git
cd ART-Analytics
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Backend

```bash
cd backend
npm run dev
```

### 4. Run Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on:

```
http://localhost:5173
```

Backend will run on:

```
http://localhost:4000
```

---

## Deployment

### Frontend (Vercel)

* Root directory: `frontend`
* Build command: `npm run build`
* Output directory: `dist`

### Backend (Render)

* Root directory: `backend`
* Build command: `npm run build`
* Start command: `npm start`

---

## Design Considerations

* **Separation of concerns**: frontend and backend are independently deployable
* **Scalability**: API-driven architecture allows easy extension (e.g., database integration)
* **Security**: CORS restrictions ensure only authorized frontend origins can access backend
* **Maintainability**: modular backend structure simplifies feature expansion

---

## Future Improvements

* Database integration (MongoDB / PostgreSQL)
* Authentication and user-specific portfolios
* Real-time market data integration
* Advanced analytics dashboard (charts, performance tracking)
* AI-assisted research summarization

---

## Author

Developed as a full-stack project demonstrating:

* system design fundamentals
* API integration
* deployment across cloud platforms
* production-ready architecture practices

---
