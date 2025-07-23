# OVR System - ASP.NET Core Backend Conversion

This document outlines the complete conversion of the OVR (Occurrence Variance Reporting) System from Node.js/TypeScript to ASP.NET Core with C# backend and SQL Server database.

## Architecture Overview

### Technology Stack
- **Backend**: ASP.NET Core 8.0 with C#
- **Database**: Microsoft SQL Server
- **ORM**: Entity Framework Core 8.0
- **Authentication**: JWT Bearer tokens with ASP.NET Core Identity
- **Frontend**: React 18 (unchanged)
- **API Documentation**: Swagger/OpenAPI

### Project Structure
```
OVRSystem/
├── OVRSystem.sln                     # Visual Studio Solution
├── server-dotnet/                    # ASP.NET Core API Project
│   ├── Controllers/                  # API Controllers
│   ├── Data/                         # Entity Framework DbContext
│   ├── DTOs/                         # Data Transfer Objects
│   ├── Models/                       # Entity Models
│   ├── Services/                     # Business Logic Services
│   ├── Mappings/                     # AutoMapper Profiles
│   ├── Program.cs                    # Application Entry Point
│   └── OVRSystem.API.csproj         # Project File
├── database/                         # SQL Server Scripts
│   ├── 01_CreateDatabase.sql        # Database Creation
│   ├── 02_InsertSeedData.sql        # Initial Data
│   └── 03_ConfigureSQLServer.sql    # Performance Configuration
└── client/                           # React Frontend (unchanged)
```

## Database Setup Instructions

### 1. Create SQL Server Database

**Option A: Using SQL Server Management Studio (SSMS)**
1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Execute the following scripts in order:
   - `database/01_CreateDatabase.sql`
   - `database/02_InsertSeedData.sql`
   - `database/03_ConfigureSQLServer.sql`

**Option B: Using Command Line**
```bash
# Using sqlcmd (replace server details as needed)
sqlcmd -S localhost -E -i database/01_CreateDatabase.sql
sqlcmd -S localhost -E -i database/02_InsertSeedData.sql
sqlcmd -S localhost -E -i database/03_ConfigureSQLServer.sql
```

### 2. Connection String Configuration

Update `server-dotnet/appsettings.json` with your SQL Server connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=OVRSystem;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true"
  }
}
```

**Common Connection String Examples:**

- **Local SQL Server (Windows Auth):**
  ```
  Server=(localdb)\\mssqllocaldb;Database=OVRSystem;Trusted_Connection=true;
  ```

- **SQL Server Express:**
  ```
  Server=.\\SQLEXPRESS;Database=OVRSystem;Trusted_Connection=true;
  ```

- **SQL Server with Username/Password:**
  ```
  Server=YOUR_SERVER;Database=OVRSystem;User Id=YOUR_USERNAME;Password=YOUR_PASSWORD;
  ```

- **Azure SQL Database:**
  ```
  Server=tcp:your-server.database.windows.net,1433;Database=OVRSystem;User ID=your-username;Password=your-password;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
  ```

## Running the Application

### 1. Install .NET 8.0 SDK
Download and install .NET 8.0 SDK from https://dotnet.microsoft.com/download

### 2. Restore NuGet Packages
```bash
cd server-dotnet
dotnet restore
```

### 3. Update Database (Entity Framework Migrations)
```bash
# Create initial migration (if needed)
dotnet ef migrations add InitialCreate

# Update database to latest migration
dotnet ef database update
```

### 4. Run the API
```bash
# Development mode
dotnet run

# Or with watch (auto-restart on changes)
dotnet watch run
```

The API will be available at:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger UI: `https://localhost:5001/swagger`

### 5. Run the React Frontend
```bash
# In a separate terminal
cd client
npm install
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (pending approval)
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout

### Incidents
- `GET /api/incidents` - Get incidents (filtered by user role/facility)
- `GET /api/incidents/{id}` - Get specific incident
- `POST /api/incidents` - Create new incident
- `PATCH /api/incidents/{id}` - Update incident
- `DELETE /api/incidents/{id}` - Delete incident (admin only)
- `POST /api/incidents/{id}/status` - Update incident status
- `POST /api/incidents/{id}/approve-closure` - Approve closure (admin)
- `POST /api/incidents/{id}/reject-closure` - Reject closure (admin)

### Comments
- `GET /api/incidents/{id}/comments` - Get incident comments
- `POST /api/incidents/{id}/comments` - Add comment

### Facilities
- `GET /api/facilities` - Get all facilities
- `GET /api/facilities/{id}` - Get specific facility

### User Management (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/registrations/pending` - Get pending registrations
- `POST /api/users/registrations/{id}/review` - Approve/reject registration
- `PATCH /api/users/{id}/status` - Update user active status

## Database Schema

### Key Tables
- **Users** - Extended ASP.NET Identity users with facility assignment
- **Facilities** - 14 hospitals from Riyadh Third Health Cluster
- **Incidents** - Main incident reporting data
- **IncidentComments** - Discussion/chat functionality
- **UserRegistrations** - Pending user registrations for approval
- **AuditLogs** - Compliance and activity tracking
- **Categories** - Incident categorization
- **Sessions** - Session management (optional)

### Default Admin Account
- **Email:** admin@r3hc.sa
- **Password:** Aa123@Aa
- **Role:** admin
- **Facility:** Ad Diriyah Hospital

## Key Differences from Node.js Version

### 1. Authentication
- **Before:** Passport.js with sessions + bcrypt
- **After:** ASP.NET Core Identity + JWT tokens

### 2. Database Access
- **Before:** Drizzle ORM with PostgreSQL
- **After:** Entity Framework Core with SQL Server

### 3. Validation
- **Before:** Zod schemas
- **After:** FluentValidation + Data Annotations

### 4. Dependency Injection
- **Before:** Manual service instantiation
- **After:** Built-in ASP.NET Core DI container

### 5. Configuration
- **Before:** Environment variables
- **After:** appsettings.json + ASP.NET Core configuration

## Development Tools

### Entity Framework Commands
```bash
# Add new migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update

# Remove last migration
dotnet ef migrations remove

# Generate SQL script
dotnet ef migrations script
```

### Testing
```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## Production Deployment

### 1. Build for Production
```bash
dotnet publish -c Release -o ./publish
```

### 2. Environment Configuration
Create `appsettings.Production.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "YOUR_PRODUCTION_CONNECTION_STRING"
  },
  "Jwt": {
    "Key": "YOUR_PRODUCTION_JWT_SECRET_KEY_256_BITS_MINIMUM"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning"
    }
  }
}
```

### 3. Deploy to IIS/Azure/Docker
The published application can be deployed to:
- **IIS** on Windows Server
- **Azure App Service**
- **Docker containers**
- **Linux servers** with nginx reverse proxy

## Migration Notes

### Frontend Updates Required
The React frontend will need minimal updates to work with the new API:

1. **Update API base URL** in `client/src/lib/queryClient.ts`
2. **Authentication headers** - Change from cookie-based to Bearer token
3. **Response format** - Some response structures may have minor differences

### Data Migration
If migrating from existing PostgreSQL data:
1. Export data from PostgreSQL using pg_dump
2. Transform data format if needed (JSON fields, date formats)
3. Import into SQL Server using bulk insert or Entity Framework

## Performance Optimizations

The SQL Server setup includes:
- **Optimized indexes** for common queries
- **Stored procedures** for complex operations
- **Query Store** enabled for performance monitoring
- **Maintenance procedures** for cleanup tasks

## Security Features

- **JWT token authentication** with configurable expiration
- **Role-based authorization** (admin/user roles)
- **Facility-based data isolation** for non-admin users
- **Audit logging** for all critical operations
- **Input validation** on all API endpoints
- **CORS configuration** for frontend integration

## Support and Maintenance

### Regular Tasks
1. **Database backups** - Set up automated SQL Server backups
2. **Session cleanup** - Schedule `sp_CleanupExpiredSessions` daily
3. **Log monitoring** - Monitor application and SQL Server logs
4. **Security updates** - Keep .NET and SQL Server updated

### Monitoring
- Use **Application Insights** for application monitoring
- Monitor **SQL Server performance counters**
- Set up **health checks** for critical components
- Configure **logging levels** appropriately for production

This ASP.NET Core implementation maintains all the functionality of the original Node.js system while providing better performance, stronger typing, and enterprise-grade features suitable for healthcare environments.