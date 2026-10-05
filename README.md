# Align - Full-Stack Team Management & Project Tracking Platform

**Align** is a modern, high-performance team management and project tracking platform designed to align teams, assign project responsibilities, monitor task deadlines, and track overall progress in real-time.

---

## 🚀 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL (with SQLite fallback for standalone development)
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic v2
- **Authentication**: JWT with Bcrypt password hashing
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git

---

## 📐 Project Structure

```
align/
├── backend/
│   ├── app/
│   │   ├── auth/           # Password hashing & JWT token handling
│   │   ├── database/       # SQLAlchemy engine, session, and seed data
│   │   ├── dependencies/   # FastAPI dependencies & RBAC permission checks
│   │   ├── models/         # SQLAlchemy models (User, Team, Project, Task, Comment, Notification)
│   │   ├── routes/         # REST API routers for auth, teams, projects, tasks, comments, dashboard
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── config.py       # Pydantic Settings & environment variables
│   │   └── main.py         # FastAPI application entry point
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Sidebar, modals, badges, cards, stats
│   │   ├── context/        # AuthContext & ToastContext providers
│   │   ├── layouts/        # DashboardLayout with responsive drawer
│   │   ├── pages/          # Login, Register, Dashboard, Teams, Projects, Tasks, MyTasks, Members, Profile
│   │   ├── services/       # API clients for auth, teams, projects, tasks, comments, users
│   │   ├── types/          # TypeScript interface declarations
│   │   ├── utils/          # Date & status formatting utilities
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css       # Tailwind CSS & glassmorphism theme styling
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 🔐 Role-Based Access Control (RBAC)

Align implements 3 levels of access:

| Role / Level | Key Permissions & Capabilities |
| :--- | :--- |
| **Admin** | Full system control. Only Admin can create/delete teams. Can reassign Team Leads, edit/delete any project, create/edit/delete tasks, and access the global Admin Analytics Dashboard. |
| **Team Lead** | A user with role `MEMBER` becomes Team Lead for a team when assigned as `lead_id`. Leads manage assigned projects, create/edit tasks, assign tasks to team members, set priorities/due dates, and monitor team workload. |
| **Team Member** | Can view teams, projects, and tasks they belong to. Members can update their task status (`To Do` &rarr; `In Progress` &rarr; `Review` &rarr; `Completed`), add comments to task discussions, and manage their profile. Members **cannot** create teams, create projects, or reassign tasks to others. |

---

## ⚡ API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register a new account
- `POST /api/auth/login` - Authenticate and obtain JWT access token
- `GET /api/auth/me` - Fetch current user profile

### Teams
- `GET /api/teams` - List accessible teams
- `POST /api/teams` - Create a new team (*Admin only*)
- `GET /api/teams/{id}` - View team details & roster
- `PUT /api/teams/{id}` - Update team details / Team Lead (*Admin or Lead*)
- `DELETE /api/teams/{id}` - Delete team (*Admin only*)
- `POST /api/teams/{id}/members` - Add member to team (*Admin or Lead*)
- `DELETE /api/teams/{id}/members/{user_id}` - Remove member from team (*Admin or Lead*)

### Projects
- `GET /api/projects` - List accessible projects
- `POST /api/projects` - Create a project (*Admin or Lead*)
- `GET /api/projects/{id}` - View project progress & tasks
- `PUT /api/projects/{id}` - Update project (*Admin or Lead*)
- `DELETE /api/projects/{id}` - Delete project (*Admin or Lead*)

### Tasks
- `GET /api/tasks` - List tasks (filters: `search`, `status`, `priority`, `project_id`, `assigned_to_id`, `my_tasks_only`)
- `POST /api/tasks` - Create a task (*Admin or Lead*)
- `GET /api/tasks/{id}` - View task details & comments
- `PUT /api/tasks/{id}` - Edit full task details (*Admin or Lead*)
- `PATCH /api/tasks/{id}/status` - Update status (*Assigned Member, Lead, or Admin*)
- `DELETE /api/tasks/{id}` - Delete task (*Admin or Lead*)

### Comments
- `GET /api/tasks/{task_id}/comments` - List task discussion comments
- `POST /api/tasks/{task_id}/comments` - Add a comment
- `PUT /api/comments/{id}` - Edit comment (*Author or Lead*)
- `DELETE /api/comments/{id}` - Delete comment (*Author or Lead*)

---

## 🔑 Default Seed Demo Accounts

When the backend initializes, the database is automatically seeded with sample data:

| Role Scope | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@align.com` | `admin123` | Full control of all Align teams & analytics |
| **Frontend Lead** | `lead.frontend@align.com` | `lead123` | Lead of "Frontend Engineering" team |
| **Backend Lead** | `lead.backend@align.com` | `lead123` | Lead of "Backend & Infrastructure" team |
| **Full-stack Member** | `dev.marcus@align.com` | `member123` | Member of both Frontend & Backend teams |
| **UI/UX Member** | `dev.emily@align.com` | `member123` | Member of Frontend Engineering team |

---

## 🐳 Quickstart with Docker Compose

1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd align
   ```

2. Start all services using Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Open your browser:
   - **Frontend App**: `http://localhost:3000` (or `http://localhost:5173`)
   - **Backend API Docs**: `http://localhost:8000/api/docs`

---

## 🛠️ Standalone Local Development (Without Docker)

### Backend Setup (FastAPI + SQLite/PostgreSQL)
```bash
cd align/backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup (Vite React)
```bash
cd align/frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
