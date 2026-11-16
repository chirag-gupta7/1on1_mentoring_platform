# Mentor-Student Platform

A production-grade real-time collaborative mentoring platform built with **FastAPI** (backend) and **Next.js** (frontend).

## Features

- **Authentication & Role Management** - JWT-based auth with Student/Mentor roles
- **Session Management** - Create, schedule, join, and track mentoring sessions
- **Collaborative Code Editor** - Monaco Editor with real-time sync via WebSockets
- **Video Calling** - Peer-to-peer WebRTC video/audio calls
- **Real-time Chat** - Persistent chat with join/leave notifications
- **Cursor Presence** - See other participants' cursor positions in real-time
- **Code Snapshots** - Auto-save code versions during sessions
- **Feedback System** - Rate and review sessions
- **Notifications** - Stay updated on session events

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python 3.12+) |
| Database | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 (async) |
| Realtime | FastAPI WebSockets |
| Code Editor | Monaco Editor |
| Video | WebRTC |
| State | Zustand |
| Auth | JWT (python-jose) |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 22+
- Python 3.12+

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd mentor_stu_platform

# Start all services
docker-compose up -d

# Seed the database with sample data
docker-compose exec backend python -m app.database.seed
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/v1/docs

### Manual Setup

#### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Unix

pip install -r requirements.txt

# Set up environment
cp ../.env.example .env

# Run database migrations (if using Alembic)
# alembic upgrade head

# Seed sample data
python -m app.database.seed

# Start the server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install

# Set up environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://localhost:8000" >> .env.local

# Start development server
npm run dev
```

## Sample Accounts

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Mentor | mentor@example.com | password123 |
| Student | student@example.com | password123 |

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Current user info

### Sessions
- `POST /api/v1/sessions` - Create session (mentor)
- `GET /api/v1/sessions/my` - My sessions
- `GET /api/v1/sessions/{id}` - Session details
- `PUT /api/v1/sessions/{id}` - Update session
- `DELETE /api/v1/sessions/{id}` - Delete session
- `POST /api/v1/sessions/{id}/join` - Join session (student)
- `POST /api/v1/sessions/{id}/end` - End session
- `POST /api/v1/sessions/{id}/cancel` - Cancel session

### Chat
- `GET /api/v1/chat/{session_id}/history` - Chat history

### Feedback
- `POST /api/v1/feedback` - Submit feedback
- `GET /api/v1/feedback/mentor/{mentor_id}` - Mentor feedback

### Notifications
- `GET /api/v1/notifications` - User notifications
- `PUT /api/v1/notifications/read` - Mark all read

### WebSocket Endpoints
- `ws://localhost:8000/ws/chat/{session_id}?token=...` - Real-time chat
- `ws://localhost:8000/ws/editor/{session_id}?token=...` - Collaborative editing
- `ws://localhost:8000/ws/signaling/{session_id}?token=...` - WebRTC signaling
- `ws://localhost:8000/ws/presence/{session_id}?token=...` - User presence

## Project Structure

```
mentor_stu_platform/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST API routes
│   │   ├── core/            # Config, security, WS manager
│   │   ├── database/        # DB session, seed
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access layer
│   │   ├── websocket/       # WS handlers
│   │   ├── middleware/      # CORS, rate limiting
│   │   ├── utils/           # Helpers, validators
│   │   └── main.py          # App entry point
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API + WebSocket clients
│   │   ├── store/           # Zustand state stores
│   │   ├── types/           # TypeScript types
│   │   └── providers/       # Context providers
│   └── package.json
├── infra/                   # Docker, Nginx configs
├── docker-compose.yml
└── README.md
```

## License

MIT
"# 1on1_mentoring_platform" 
