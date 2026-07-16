# AlmaUMS — University Management System

A full-stack University Management System with role-based dashboards for **Admins**, **Faculty**, **Students**, and **Accounts** staff — covering academics, attendance, exams, assignments, auto-graded MCQ tests, fee management and campus communication in one connected application.

**Stack:** Java 21 · Spring Boot 3 · Spring Security (JWT) · Spring Data JPA · MySQL — React 18 · React Router · Axios · Vite

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Default Login Credentials](#default-login-credentials)
- [Role Overview](#role-overview)
- [MCQ Auto-Import Format](#mcq-auto-import-format)
- [API Overview](#api-overview)
- [What Was Fixed / Added In This Pass](#what-was-fixed--added-in-this-pass)
- [Known Limitations & Notes](#known-limitations--notes)
- [Deploying](#deploying)

---

## Features

### Public site
- **Landing page** with a product overview, feature grid and role breakdown
- **About page** explaining the project, its design principles and tech stack
- **Contact page** with a working form — submissions are stored and reviewable by Admins under *Contact Messages*

### Core academics
- Departments, Faculty, Students, Courses, Enrollments, Timetable
- **Faculty course management** — faculty can edit the title, description, syllabus, credits and seat count of courses they teach (enforced server-side, not just hidden in the UI)
- **My Profile** page for Students and Faculty — personal + academic details and quick links, separate from the admin's management views
- **Attendance** — mentor-only marking, optional remarks per entry, and a "marked by" audit trail
- **Exams & Results**, plus a **Gradebook** for assigning final course letter grades
- **Announcements** (notice board) targeted by role and priority
- **Academic Calendar** — holidays, exams, deadlines, events

### Course content (module-wise)
Every course is broken into **Modules**, and each module can have:
- **Notes** — link to a hosted file (Drive/Dropbox/etc.), viewable by enrolled students
- **Assignments** — faculty post a brief + deadline; students submit a link back before the deadline (late submissions are flagged automatically); faculty grade with marks + feedback
- **MCQ Exams** — faculty **upload a Word (.docx) or PDF** question sheet and the system **automatically parses the questions**; once published, students take the quiz **online and get an instantly auto-graded score** with a full review of correct/incorrect answers

### Fee Management (Accounts role)
A dedicated **Accounts** role with its own dashboard:
- Fee structures (per academic year / semester)
- Invoice generation per student
- Payment recording with automatic receipt numbers
- **Printable / "Save as PDF" fee receipts** (browser print, formatted like a real receipt)
- **Fee reminders** — Accounts/Admin can nudge a specific student about a due invoice; the student sees it as a banner the next time they open *My Fees*
- Dues summary dashboard (collected, outstanding, pending/partial/paid counts) with a quick "Remind" action on overdue invoices

### Built-in Help Assistant
Every authenticated dashboard has a floating **Help** button — a small rule-based chatbot (the kind of hardcoded-FAQ widget seen on most product sites) that answers common questions about attendance, results, assignments, MCQ exams, fees, timetable, notices and more, entirely client-side.

---

## Project Structure

```
.
├── ums-backend/                 Spring Boot API (Java 21)
│   └── src/main/java/com/university/ums/
│       ├── entity/              JPA entities
│       ├── repository/          Spring Data repositories
│       ├── controller/          REST controllers
│       ├── config/               Security config + DataSeeder (demo data)
│       ├── security/             JWT filter / user details service
│       ├── util/                 McqDocumentParser (docx/pdf → questions)
│       └── exception/            Global exception handling
│
└── ums-frontend/                React app (Vite)
    └── src/
        ├── pages/                One file per route/page
        ├── components/           Shared layout, UI kit, chatbot, receipt
        ├── context/               Auth + Theme providers
        ├── services/api.js       All backend API calls
        └── utils/helpers.js      Formatting / color helpers
```

---

## Getting Started

### Prerequisites
- Java 21+, Maven 3.9+
- Node.js 18+, npm
- MySQL 8+ running locally (or update the connection env vars)

### 1. Backend

```bash
cd ums-backend

# Configure the database (defaults shown — override with env vars if needed)
export DATABASE_URL="jdbc:mysql://localhost:3306/ums_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC"
export DB_USER=root
export DB_PASS=12345
export JWT_SECRET="replace-with-a-long-random-string-in-production"

mvn spring-boot:run
```

The API starts on `http://localhost:8080/api/v1`. Tables are created automatically (`ddl-auto=update`) and the database is **seeded with demo data on first run** (see credentials below) — seeding is skipped automatically on subsequent restarts once any user exists.

Swagger UI: `http://localhost:8080/api/v1/swagger-ui`

### 2. Frontend

```bash
cd ums-frontend
npm install
npm run dev
```

Opens on `http://localhost:3000` and proxies `/api` calls to the backend on port 8080 (see `vite.config.js`).

For a production build: `npm run build` (outputs to `ums-frontend/dist`).

---

## Default Login Credentials

Seeded automatically on first backend run:

| Role         | Username        | Password     | Notes                                             |
|--------------|-----------------|--------------|----------------------------------------------------|
| Admin        | `admin`         | `admin123`   | Full access                                        |
| Faculty      | `anjali.sharma` | `faculty123` | **Mentor** — can mark attendance                   |
| Faculty      | `ravi.kumar`    | `faculty123` | **Not a mentor** — attendance is view-only          |
| Student      | `arjun.mehta`   | `student123` | Enrolled in DBMS + Machine Learning                |
| Student      | `priya.nair`    | `student123` | Has a pending fee invoice + an unread fee reminder |
| Accounts     | `accounts`      | `accounts123`| Fee management dashboard                           |

> The `ravi.kumar` / `anjali.sharma` pair is intentional — it's the easiest way to demonstrate the mentor-only attendance behavior: log in as `ravi.kumar` and confirm attendance is read-only, then log in as `admin`, toggle his "Can mark attendance" switch on in Faculty Management, and log back in as `ravi.kumar` (or just reopen the Attendance page — mentor status is always re-checked fresh on page load).

---

## Role Overview

| | Admin | Faculty | Student | Accounts |
|---|---|---|---|---|
| Manage departments/faculty/students | ✅ | – | – | – |
| Manage courses & enrollments | ✅ | view | view | – |
| Mark attendance | ✅ | mentors only | – | – |
| Create modules / notes / assignments / MCQ | ✅ | own courses | – | – |
| Submit assignments / take MCQ exams | – | – | ✅ | – |
| Gradebook (final grades) | ✅ | own courses | view own | – |
| Fee structures / invoices / payments / reminders | view | – | own invoices | ✅ |
| Announcements | ✅ | ✅ | view | view |
| Academic calendar | ✅ | ✅ | view | view |
| Contact messages inbox | ✅ | – | – | – |

---

## MCQ Auto-Import Format

When a faculty member uploads a `.docx` or `.pdf` question sheet, it's parsed with a tolerant format:

```
1. What is the capital of France?
A) Berlin
B) Madrid
C) Paris
D) Rome
Answer: C

2) Which language runs in a web browser?
A. Java
B. C
C. Python
D. JavaScript
Ans: D
```

- Numbering: `1.`, `1)`, `Q1.` are all accepted
- Options: `A)`, `A.`, `(A)` are all accepted
- Answer line: `Answer:`, `Ans:`, `Correct Answer:` are all accepted, case-insensitive
- Only questions with 2+ options **and** a valid answer letter are imported; malformed questions are silently skipped

---

## API Overview

Base path: `/api/v1`

| Area | Examples |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| Attendance | `POST /attendance/mark` *(remarks supported, mentor-only)*, `GET /attendance/student/{id}` |
| Course content | `GET/POST /modules`, `GET/POST /notes`, `GET/POST /assignments`, `POST /assignments/{id}/submit` |
| MCQ | `POST /mcq/upload` *(multipart docx/pdf)*, `GET /mcq/{id}/take`, `POST /mcq/{id}/submit` *(auto-graded)* |
| Gradebook | `PATCH /enrollments/{id}/grade` |
| Fees | `POST /fees/invoices`, `POST /fees/invoices/{id}/payments`, `POST /fees/invoices/{id}/remind`, `GET /fees/dues-summary` |
| Calendar | `GET/POST /calendar`, `GET /calendar/upcoming` |
| Contact | `POST /contact` *(public)*, `GET /contact` *(admin)* |

All protected endpoints expect `Authorization: Bearer <jwt>`.

---

## What Was Fixed / Added In This Pass

**Bug fixes**
- **Faculty "can mark attendance" toggle didn't persist** — `FacultyController#updateFaculty` never copied `isMentor` (or several other fields) from the request onto the saved entity. Fixed.
- **Already-mentor faculty appeared unable to mark attendance** — the frontend cached mentor status in `localStorage` at login time only, so changes made by an admin mid-session were invisible until logout/login. The app now re-checks mentor status fresh from the server whenever the Attendance page is opened.
- **No way to add remarks when marking attendance** — added a remarks field to the marking form and wired it through to the existing (already-supported) backend field.
- **"Marked by" wasn't showing** — a consequence of the two bugs above; once faculty can actually mark attendance, the existing `markedBy` display works correctly.
- Fixed several **CSS class-name mismatches** between components and `index.css` that silently broke styling (sidebar section labels, the collapse button, stat card icon/accent-bar sizing, and a `var(--teal)` token that was referenced but never defined).
- Restricted the `/dev/*` password-hash helper endpoints to non-production profiles.

**New features**
1. Public **Landing / About / Contact** pages, with contact submissions viewable by Admins
2. **Help chatbot** widget on every authenticated dashboard
3. **Course Modules** with **Notes**, **Assignments** (link-based submission with deadline/late tracking) and **auto-graded MCQ exams** (auto-imported from Word/PDF)
4. **Gradebook** for assigning final course grades
5. **Academic Calendar**
6. A full **Accounts role** with its own dashboard: fee structures, invoices, payments, dues summary, **fee reminders**, and **printable PDF fee receipts**

---

## Known Limitations & Notes

- **This backend could not be compiled in the environment used to build it** (no access to Maven Central from that sandbox). Every file was written and manually re-verified against the actual entity/repository signatures, but please run `mvn clean compile` (or just start the app) as your first step after cloning, and open an issue/PR if anything surfaces.
- The frontend **was** built and verified successfully (`npm run build`) as part of this work.
- MCQ file parsing expects the format documented above — free-form question sheets that don't follow *some* numbered-question / lettered-option structure won't import cleanly.
- Fee receipts are generated via the browser's native print dialog ("Save as PDF" as the destination) rather than a server-generated PDF file — this avoids extra dependencies and produces a clean, real PDF with zero setup.
- `spring.jpa.hibernate.ddl-auto=update` is convenient for development but isn't a substitute for real migrations in production (consider Flyway/Liquibase before going live).

---

## Deploying

This repo is set up to deploy as-is — no code changes needed, just environment variables:

- **Backend**: deploys via Docker (`ums-backend/Dockerfile` — a multi-stage Maven build → slim JRE image).
  This is required on Render specifically because it has no native "Java" runtime for Blueprints; Docker is
  the standard way to run a Spring Boot jar there (and works the same way on Railway, Fly.io, etc. if you'd
  rather use those instead).
  Env vars: `DATABASE_URL`, `DB_USER`, `DB_PASS`, `JWT_SECRET`, `PORT`, `SPRING_PROFILES_ACTIVE=prod`, and
  `CORS_ALLOWED_ORIGINS` (comma-separated frontend URL(s) — defaults to `*` if unset). A `render.yaml`
  blueprint is included at the repo root for one-click setup on Render.
- **Frontend**: `npm run build` and deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages).
  Set `VITE_API_BASE_URL` to your deployed backend's API root (see `ums-frontend/.env.example`) — locally this is
  left unset and the Vite dev-server proxy handles it instead.
- Once both are live, set `CORS_ALLOWED_ORIGINS` on the backend to your actual frontend URL and redeploy.
