# FreelanceMusic

A full-stack music learning platform built with ASP.NET Core Web API and vanilla JavaScript.

## Project Structure

```
FreelanceMusic/
├── frontend/
│   ├── index.html          # Single HTML file with div id="app"
│   └── js/
│       └── app.js          # Main JavaScript application
├── backend/
│   ├── Controllers/        # API Controllers
│   ├── Models/             # Data Models
│   ├── Services/           # Business Logic
│   └── Program.cs          # Application entry point
└── api/
    └── database.db         # SQLite database file
```

## Technology Stack

### Frontend
- **HTML/CSS**: Plain HTML/CSS with Bootstrap 5.3 from CDN
- **JavaScript**: Vanilla JavaScript (ES6+)
- **No Frameworks**: React, Vue, or Angular not used

### Backend
- **Framework**: ASP.NET Core Web API (.NET 8)
- **Database**: SQLite with direct SQL queries (no ORM)
- **NuGet Package**: Microsoft.Data.Sqlite

## Getting Started

### Backend Setup
```bash
cd backend
dotnet restore
dotnet run
```

The backend will run on `http://localhost:5000`

### Frontend Setup
Open `frontend/index.html` in a web browser or use a local web server.

## API Endpoints

API endpoints will be defined in the `Controllers/` directory.

## Database

The SQLite database is located at `api/database.db`. Direct SQL queries are used throughout the application.
