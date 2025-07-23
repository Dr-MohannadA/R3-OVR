# Occurrence Variance Reporting (OVR) System

## Overview

This is a full-stack web application for healthcare incident reporting built for the Riyadh Third Health Cluster. The system allows for public incident reporting and provides authenticated dashboard functionality for healthcare professionals to track, manage, and analyze incident reports across different facilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with Shadcn/UI component library
- **State Management**: React Query (TanStack Query) for server state
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript (ES Modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit OpenID Connect (OIDC) integration
- **Session Management**: Express sessions with PostgreSQL store

### Project Structure
- **Monorepo layout** with shared schema between client and server
- `/client` - React frontend application
- `/server` - Express.js backend API
- `/shared` - Shared TypeScript schemas and types

## Key Components

### Database Schema (Drizzle ORM)
- **Sessions table** - Required for Replit Auth session storage
- **Users table** - User profiles with roles (admin/user)
- **Facilities table** - Healthcare facilities in the cluster
- **Categories table** - Incident categorization system
- **Incidents table** - Core incident reports with relations
- **Audit logs table** - Activity tracking and compliance

### Authentication System
- **Replit OIDC integration** for secure authentication
- **Role-based access control** (admin vs regular users)
- **Session persistence** with PostgreSQL backend
- **Middleware protection** for authenticated routes

### API Structure
- **Public routes** - Incident reporting, facilities/categories lookup
- **Protected routes** - Dashboard, user management, incident management
- **RESTful design** with consistent error handling
- **Request logging** and performance monitoring

### UI Components
- **Shadcn/UI component library** for consistent design
- **Responsive design** with mobile-first approach
- **Custom theming** with CSS variables
- **Toast notifications** for user feedback
- **Form validation** with real-time error display

## Data Flow

### Public Incident Reporting
1. User accesses public form (no authentication required)
2. Form validates input using Zod schemas
3. Server creates incident with auto-generated OVR ID
4. Audit log entry created for tracking
5. Success confirmation displayed to user

### Authenticated Dashboard
1. User authenticates via Replit OIDC
2. Session established and stored in PostgreSQL
3. Dashboard loads with role-appropriate features
4. Real-time metrics fetched via React Query
5. Incident management with filtering and updates

### User Management (Admin only)
1. Admin role verification on route access
2. User list with statistics and role management
3. User activation/deactivation functionality
4. Audit logging for administrative actions

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless** - PostgreSQL database connection
- **drizzle-orm** - Type-safe database ORM
- **express** - Web server framework
- **passport** - Authentication middleware
- **@tanstack/react-query** - Server state management
- **@radix-ui** - Headless UI components
- **wouter** - Lightweight routing

### Development Tools
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **ESBuild** - Fast bundling for production

### Replit Integration
- **Replit Auth** - OIDC authentication provider
- **Replit database** - PostgreSQL hosting
- **Replit deployment** - Hosting and environment management

## Deployment Strategy

### Development Environment
- **Vite dev server** for frontend with HMR
- **tsx** for TypeScript execution
- **Concurrent development** - Frontend and backend run together
- **Environment variables** for database and auth configuration

### Production Build
1. **Frontend build** - Vite builds optimized React app
2. **Backend build** - ESBuild bundles server code
3. **Database migrations** - Drizzle handles schema updates
4. **Static file serving** - Express serves built frontend

### Environment Configuration
- **DATABASE_URL** - PostgreSQL connection string
- **SESSION_SECRET** - Session encryption key
- **REPL_ID** - Replit application identifier
- **NODE_ENV** - Environment mode (development/production)

### Database Management
- **Drizzle migrations** - Schema version control
- **Seed data initialization** - Default facilities and categories
- **Connection pooling** - Efficient database connections
- **Session cleanup** - Automatic expired session removal

The system follows a modern full-stack architecture with strong separation of concerns, type safety throughout, and scalable patterns for healthcare compliance and audit requirements.

## Recent Updates (January 2025)

### Hospital Data Correction (July 19, 2025)
- ✓ Fixed critical hospital list issue with correct 14 hospitals from Riyadh Third Health Cluster
- ✓ Updated database with authentic hospital names: Ad Diriyah Hospital, Eradah Mental Health Complex, Dharmaa General Hospital, Al‑Bejadiah General Hospital, Marat General Hospital, Al‑Rafaia in Jemsh General Hospital, Wethelan General Hospital, Nafy General Hospital, Sajer General Hospital, Thadeq General Hospital, Huraymla General Hospital, Afif General Hospital, Shaqra General Hospital, Al Dawadmi General Hospital
- ✓ Added proper bilingual display (Arabic/English) in both incident reporting and registration forms
- ✓ Fixed registration approval bug where undefined `newUser` variable caused server error

### Dual Authentication System Implementation (July 19, 2025)
- ✓ Implemented complete local authentication system for regular users with email/password
- ✓ Fixed database schema issues - migrated facility to facilityId columns properly
- ✓ Added bcrypt password hashing for secure local authentication
- ✓ Created admin account: admin@r3hc.sa with local authentication
- ✓ Registration workflow: Users register → Admin approves → Users can login
- ✓ Proper error handling for pending/rejected users during login attempts
- ✓ Session management working for both local and Replit authentication

### Registration System Enhancement
- ✓ Implemented user registration with facility selection using 14 hospitals from Riyadh Third Health Cluster
- ✓ Added bilingual facility support (Arabic/English) with nameEn and nameAr fields
- ✓ Created admin dashboard for registration approval/rejection workflow
- ✓ Updated database schema with facilityId field for proper data integrity

### User Dashboard Features
- ✓ Implemented facility-specific incident filtering for regular users
- ✓ Added action buttons for comments and proof upload on incidents
- ✓ Created comment and proof upload dialogs with proper validation
- ✓ Added API endpoints for incident comments and proof upload with facility-based access control

### Database Schema Updates
- ✓ Updated facilities table with bilingual names (nameEn, nameAr)
- ✓ Modified userRegistrations table to use facilityId instead of facility names
- ✓ Added proper foreign key relationships between users and facilities
- ✓ Implemented audit logging for all registration and incident actions

### Security & Access Control
- ✓ Regular users can only view incidents from their assigned facility
- ✓ Facility-based access control for comments and proof uploads
- ✓ Admin users retain full system access across all facilities
- ✓ Proper authentication checks on all protected endpoints

### Authentication System Fixes (July 19, 2025)
- ✓ Fixed admin account creation with proper credentials: admin@r3hc.sa / Aa123@Aa
- ✓ Resolved database constraint errors in audit log creation
- ✓ Fixed foreign key violations when deleting users
- ✓ Improved error handling for dual authentication system
- ✓ Fixed authentication failures by properly setting up admin user in database

### Dashboard Filter System Enhancement (July 20, 2025)
- ✓ **Fixed facility filter** - Updated to use correct nameEn property from database
- ✓ **Added date range filtering** - Date From and Date To inputs with calendar icons
- ✓ **Enhanced status filter** - Added "Pending Closure" status option
- ✓ **Connected backend filtering** - All filters now properly query the database with AND logic
- ✓ **Added clear filters button** - Shows when any filters are active
- ✓ **Improved responsive layout** - Better grid layout for all filter options
- ✓ **Performance optimization** - Database-level filtering with proper query parameters

### Comment System Complete Redesign (July 20, 2025)
- ✓ **Chat-like interface** - Replaced traditional comment system with modern chat UI
- ✓ **User avatars** - Added circular avatars with user initials
- ✓ **Role-based styling** - Admin badges and different visual treatment
- ✓ **Real-time timestamps** - Formatted display with relative dates
- ✓ **Enhanced message dialog** - Character counter, user context, better UX
- ✓ **Improved data flow** - Fixed comment refresh issues with proper cache invalidation
- ✓ **Empty state design** - Better visual feedback when no comments exist
- ✓ **Integrated chat header** - Add button directly in discussion section

### Login Page & Closure Comments Integration (July 22, 2025)
- ✓ **Removed Replit Admin Login** - Eliminated admin login (Replit) button from login page for cleaner interface
- ✓ **Automatic Closure Comments** - All closure-related actions now automatically add formatted comments to discussion:
  - User closure requests: Shows reason and status with 🔒 icon
  - Admin closure approvals: Shows approval with ✅ icon and original reason
  - Admin closure rejections: Shows rejection reason with ❌ icon and original request
- ✓ **Enhanced Comment Integration** - Closure workflow now seamlessly integrates with chat-style comment system
- ✓ **Real-time Comment Updates** - Comments cache properly invalidates after closure actions for immediate visibility
- ✓ **Comprehensive Discussion Trail** - All incident actions and decisions now visible in unified discussion interface

### Dashboard Table & Edit Functionality Enhancement (July 22, 2025)
- ✓ **Updated Dashboard Table Structure** - Restored correct table columns: OVR ID, Facility, Category, Date, Status, Priority, Actions
- ✓ **Category Field Correction** - Dashboard now shows actual OVR Category from form submissions instead of separate categories table
- ✓ **Facility-Based Access Control** - Non-admin users can only view incidents from their assigned facility, while admins see all incidents
- ✓ **Edit Functionality Implementation** - Added edit buttons for OVR Category and "What is being reported" fields with:
  - Mandatory comment requirement for all edits
  - Dropdown selection for incident type (incident/near_miss/mandatory_reportable_event/sentinel_event)
  - Free text input for OVR Category
  - Automatic comment logging with 📝 icon showing old/new values and reason
- ✓ **Enhanced Mobile View** - Updated mobile card view to display correct OVR Category field
- ✓ **Type Safety Improvements** - Fixed all TypeScript type errors for user role and property access

### Home Page Button Design Restoration (July 22, 2025)
- ✓ **Rectangular Button Design** - Restored home page buttons to original rectangular card layout as preferred by user
- ✓ **Centered Icon Layout** - Large circular colored icons centered above button titles and descriptions
- ✓ **Clean Card Design** - White cards with proper spacing and hover effects
- ✓ **Color-coded Icons** - Blue for Dashboard, Green for Report Incident, Purple for User Management
- ✓ **Responsive Layout** - Maintains proper grid layout across different screen sizes

## ASP.NET Core Backend Conversion (July 23, 2025)

### Complete Architecture Migration
- ✓ **Full Backend Rewrite** - Converted entire Node.js/TypeScript backend to ASP.NET Core 8.0 with C#
- ✓ **Database Migration** - Migrated from PostgreSQL with Drizzle ORM to SQL Server with Entity Framework Core
- ✓ **Authentication System** - Replaced Passport.js + sessions with ASP.NET Core Identity + JWT tokens
- ✓ **API Structure** - Maintained same REST API endpoints with improved type safety and validation
- ✓ **Database Schema** - Preserved all data structures and relationships in SQL Server format

### New Technology Stack
- ✓ **Backend Framework** - ASP.NET Core 8.0 with built-in dependency injection
- ✓ **Database** - Microsoft SQL Server with optimized indexes and stored procedures
- ✓ **ORM** - Entity Framework Core 8.0 with Code First migrations
- ✓ **Authentication** - JWT Bearer tokens with role-based authorization
- ✓ **Validation** - FluentValidation + Data Annotations for request validation
- ✓ **Documentation** - Swagger/OpenAPI integration for API documentation

### Database Setup Scripts
- ✓ **Complete Database Creation** - Full SQL Server database schema with all tables and relationships
- ✓ **Seed Data Implementation** - All 14 hospitals and categories with proper bilingual support
- ✓ **Performance Optimization** - Indexes, stored procedures, and Query Store configuration
- ✓ **Production Security** - Dedicated database user with least-privilege permissions
- ✓ **Backup Strategy** - Automated backup scripts and maintenance procedures

### Enhanced Features
- ✓ **Improved Type Safety** - Strong typing throughout the application with C# models
- ✓ **Better Performance** - Optimized SQL Server queries and Entity Framework performance
- ✓ **Enterprise Security** - Enhanced security with JWT tokens and audit logging
- ✓ **Scalability** - Built for enterprise deployment with IIS, Azure, or Docker support
- ✓ **Monitoring** - Built-in health checks and performance monitoring capabilities