# 📋 Online Survey & Quiz System

A **web-based survey and quiz application** built on the **MERN stack**, inspired by **Google Forms**: create forms with multiple question types, share links, collect responses; supports **Quiz** mode with **automatic scoring**, **login required**, and **one submission per account**.

---

## ✨ Features

| Area | Description |
|------|-------------|
| **Form builder** | Create forms with title, description, and **cover image**; add *short answer*, *paragraph*, *multiple choice*, and *checkbox* questions; **reorder** questions (up/down), delete questions; mark questions as required. |
| **Rich text (questions)** | Edit question text as HTML with **Tiptap** (bold, italic, underline, link, clear formatting); safe rendering with **DOMPurify**. |
| **Images** | **Cloudinary**: form cover, per-question images, per-option images (MCQ), **user avatars**; uploads via JWT-protected APIs. |
| **Survey / Quiz** | Toggle **Quiz** mode: respondents must **log in** and can submit **once**; set **correct answers** and **points** for multiple-choice items. |
| **Scoring** | **Total score** computed on submit; **results / breakdown** page per question (correct/incorrect, points earned). |
| **Authentication** | **Register / login**, password hashing (**bcryptjs**), **JWT** sessions; protected routes for the dashboard and creator-only actions. |
| **Creator permissions** | Only the **creator** may **edit** or **delete** a form; delete **cascades** to all related `Response` documents. |
| **Safe edit API** | `GET .../edit` returns full builder data (including quiz answers); public `GET` **hides** correct answers. |
| **Dashboard** | **My forms** tab (edit / delete / copy link / view responses), **Submission history** tab; avatar management. |
| **Respondents** | Google Forms–style fill experience; completed quizzes show status and a link to view results. |
| **Seed data** | `npm run seed` creates demo users and forms for quick testing. |

---

## 🛠 Tech stack

### Overview
- **M**ongoDB + **M**ongoose  
- **E**xpress.js  
- **R**eact 19 + **R**eact Router 7  
- **N**ode.js  

### Backend (`backend/`)
- **express**, **cors**, **dotenv**
- **mongoose** — ODM & schemas
- **jsonwebtoken** — JWT
- **bcryptjs** — password hashing
- **multer** + **multer-storage-cloudinary** + **cloudinary** — image uploads

### Frontend (`client/`)
- **Vite 8** — bundler & dev server
- **Tailwind CSS 4** (`@tailwindcss/vite`)
- **axios** — HTTP client
- **@tiptap/react** + Starter Kit, Underline, Link — rich text (not React Quill)
- **dompurify** — HTML sanitization for display
- **react-toastify** — notifications

---

## 📁 Project structure (summary)

```
Online-Survey-System/
├── backend/
│   ├── config/           # cloudinary.js
│   ├── controllers/      # auth, survey, response, user, upload
│   ├── middleware/       # auth.js, upload.js
│   ├── models/           # User, Survey, Response
│   ├── routes/           # api.js, auth.js, users.js
│   ├── utils/            # quizScoring, surveyNormalize
│   ├── server.js
│   ├── seed.js
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/   # layout, builder, ImageUploader, QuestionRichEditor
│   │   ├── context/      # AuthContext
│   │   ├── pages/        # Dashboard, CreateSurvey, ViewSurvey, Login, ...
│   │   ├── utils/        # sanitizeHtml, options
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
├── README.md
└── README.en.md
```

---

## 📦 Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Node.js** | **v18+** or **v20 LTS** recommended |
| **MongoDB** | Local or Atlas (`MONGODB_URI`) |
| **Cloudinary** | Free tier; **Cloud name**, **API Key**, **API Secret** (required for image uploads) |
| **npm** | Bundled with Node.js |

---

## 🚀 Installation & getting started

### 1. Clone the repository

```bash
git clone <your-repo-url>.git
cd Online-Survey-System
```

### 2. Backend

```bash
cd backend
npm install
```

Create **`backend/.env`** (see environment variables below).

```bash
# Run API (default port 5000)
npm run dev
# or production
npm start
```

### 3. Frontend

Open a new terminal:

```bash
cd client
npm install
```

Create **`client/.env`** if needed (see table below).

```bash
npm run dev
```

Browser: **http://localhost:5173** — Vite **proxies** `/api` to the backend (default **http://localhost:5000**).

### 4. (Optional) Seed sample data

```bash
cd backend
npm run seed
```

> ⚠️ The seed script **wipes** existing `User`, `Survey`, and `Response` collections, then inserts demo data.

---

## 🔐 Environment variables (`.env`)

### Backend — `backend/.env`

| Variable | Description | Example value |
|----------|-------------|----------------|
| `PORT` | HTTP API port | *(empty → 5000)* |
| `MONGODB_URI` | MongoDB connection string |  |
| `JWT_SECRET` | Secret for signing JWTs |  |
| `JWT_EXPIRES_IN` | Token lifetime (optional) | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |  |
| `CLOUDINARY_API_KEY` | API key |  |
| `CLOUDINARY_API_SECRET` | API secret |  |

### Client — `client/.env`

| Variable | Description | Example value |
|----------|-------------|----------------|
| `VITE_API_BASE_URL` | API base URL (Vite proxy & production build) | `http://localhost:5000` |

> In **development**, if `VITE_API_BASE_URL` is unset, the Vite dev proxy still defaults to `http://localhost:5000`.

---

## 🗄 Data models (MongoDB / Mongoose)

### `User`
- `name`, `email` (unique), `password`, `avatarUrl`, timestamps  

### `Survey`
- `title`, `description`, `coverUrl`, `creatorId` → User  
- `status`: `draft` | `published` | `closed`  
- `isQuiz`: boolean  
- `questions[]`: `questionId`, `type`, `text` (HTML), `imageUrl`, `isRequired`, `options` (`{ text, imageUrl }`), `correctAnswers`, `points`  
- timestamps  

### `Response`
- `surveyId`, `userId` (nullable — guests), `respondentEmail`  
- `answers[]`: `questionId`, `answerValue` (string or array)  
- `score` (quiz), timestamps  
- index `(surveyId, userId)`  

---

## 📡 API endpoints (summary)

**Auth** — prefix `/api/auth`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/register` | Register |
| `POST` | `/login` | Login |
| `GET` | `/me` | Current user (Bearer JWT) |

**Users** — prefix `/api/users` (JWT)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/my-surveys` | Forms created by the user |
| `GET` | `/my-responses` | Logged-in submission history |
| `GET` | `/my-responses/:responseId` | Single submission detail |

**Surveys & responses** — prefix `/api`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/upload` | JWT | Image upload (field `file`) |
| `POST` | `/upload-avatar` | JWT | User avatar (field `file`) |
| `GET` | `/surveys` | — | Survey list (summary) |
| `POST` | `/surveys` | JWT | Create survey |
| `GET` | `/surveys/:id/edit` | JWT + creator | Full data for editing (incl. quiz keys) |
| `PUT` | `/surveys/:id` | JWT + creator | Update survey |
| `DELETE` | `/surveys/:id` | JWT + creator | Delete survey + responses |
| `GET` | `/surveys/:id` | Optional JWT | Public form (hides answers; special state if quiz already done) |
| `POST` | `/surveys/:id/submit` | Optional | Submit answers |
| `GET` | `/surveys/:id/responses` | JWT + creator | List responses |
| `GET` | `/surveys/:id/responses/:responseId/summary` | — | Quiz scoring breakdown |

**Other**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | API & DB health check |

---

## 👤 Author

**Group 6**
- Ha Cong Thanh Dat  
- Huynh Thanh Cong  
- Vu Dinh Nghia  
- Nguyen Cong Khanh 

---

*Documentation reflects the actual source code in this repository.*
