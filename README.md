# CampusCare — College Complaint Management System

A runnable Django REST Framework + MySQL project with a responsive HTML/CSS/JavaScript frontend. Since no existing backend files or API contract were present, this project defines a complete, internally consistent API and frontend.

## Features

- Student complaint submission and tracking
- Department directory
- Staff complaint assignment and status updates
- Resolution feedback and ratings
- Django admin for managing students, departments, staff, complaints, updates, and feedback
- Responsive frontend with overview, complaint list, filters, detail view, submission, feedback, and staff workflow

## Requirements

- Python 3.10+
- MySQL 8+

## Setup

1. Create and activate a virtual environment, then install dependencies:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. Create a MySQL database and user:

   ```sql
   CREATE DATABASE campuscare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'campuscare_user'@'localhost' IDENTIFIED BY 'change-this-password';
   GRANT ALL PRIVILEGES ON campuscare.* TO 'campuscare_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. Copy `.env.example` to `.env`, then set the database credentials and a new `DJANGO_SECRET_KEY`.
4. Apply migrations and create the admin login:

   ```powershell
   python manage.py makemigrations complaints
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```

5. Open `http://127.0.0.1:8000/` for the app or `http://127.0.0.1:8000/admin/` to configure departments and staff. Static frontend files are served by Django, so local CORS configuration is not needed.

## API

All API routes are under `/api/`. Paginated collection responses use DRF's `{count, next, previous, results}` format.

| Method | Route | Purpose |
|---|---|---|
| GET, POST | `/api/students/` | List/register students |
| GET | `/api/students/{id}/` | Student detail |
| GET, POST | `/api/departments/` | List/create departments |
| GET | `/api/departments/{id}/` | Department detail |
| GET, POST | `/api/complaints/` | List/create complaints |
| GET | `/api/complaints/{id}/` | Complaint and status history |
| GET, POST | `/api/assignments/` | List/create staff assignments |
| GET, POST | `/api/status-updates/` | List/add status updates |
| GET, POST | `/api/feedback/` | List/create resolution feedback |

Complaint creation expects `student`, `department`, `title`, and `description`. `student` is a student record ID. Optional student filtering is supported with `?student=<id>`. Assignments use `complaint`, `staff_name`, and optional `note`. Status updates use `complaint`, `status`, and optional `note`. Feedback uses `complaint`, `rating` (1–5), and optional `comment`.

## Notes

This is a mini-project demonstration and uses open API permissions so the UI can run without an account flow. Before deploying publicly, add authentication, role-based permissions, rate limiting, and privacy controls. The admin site is the staff management interface; the student frontend exposes submission and feedback, while APIs are available for assignments and status changes.
