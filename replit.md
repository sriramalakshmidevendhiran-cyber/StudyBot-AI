# StudyBot - AI College Assistant

## Overview
StudyBot is an educational web application providing AI-powered learning assistance for college students. Its core features include an emotion-aware AI tutor, an interactive quiz generator, a study plan creator with progress tracking, and a memory curve revision system based on the Ebbinghaus Forgetting Curve. The application leverages the Google Gemini API for content generation, incorporates text-to-speech with mood-adaptive voice, and persists user data (quiz results, study plans, revision schedules) in a PostgreSQL database for comprehensive progress tracking.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript (Vite)
- **UI**: Shadcn/ui (Radix UI primitives), Tailwind CSS, Material Design 3 principles
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing (Home, Quiz History, Landing, 404)
- **Design System**: Custom color palette, Inter/JetBrains Mono fonts, responsive design.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **API**: RESTful JSON endpoints (`/api/tutor`, `/api/quiz`, `/api/plan`, etc.)
- **Validation**: Zod schemas for type-safe request validation.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: `connect-pg-simple` for PostgreSQL-backed sessions.
- **Tables**: `users`, `sessions`, `quizResults`, `savedStudyPlans`, `learned_topics`.

### Authentication & Authorization
- **Integration**: Replit Auth (OAuth-based OIDC provider)
- **Features**: Login/logout, user info endpoint, protected routes, automatic user creation.

### Design Patterns
- **Separation of Concerns**: `/client`, `/server`, `/shared` directories.
- **Type Safety**: End-to-end TypeScript with Zod schemas.
- **Error Handling**: Centralized with user-friendly messages and toast notifications.
- **Progressive Enhancement**: Semantic HTML, accessibility-first design.

### Key Features
- **Emotion-Aware AI Tutor**: Adapts explanation tone, difficulty, and text-to-speech voice based on detected user mood.
- **Interactive Quiz System**: AI-generated multiple-choice quizzes, real-time scoring, results saving, and history tracking.
- **Study Plan Creator**: AI-generated study plans, save/edit functionality, progress tracking (completion checkboxes, progress bars), and deletion.
- **Memory Curve Revision System**: Automated topic tracking, Ebbinghaus-based revision scheduling, retention percentage display, and one-click completion.

## External Dependencies
- **AI Service**: Google Gemini API (`gemini-2.5-flash`, `gemini-2.5-pro`) via `@google/genai` SDK.
- **Database Service**: Neon Serverless PostgreSQL.
- **Third-Party UI Libraries**: Radix UI, Embla Carousel, React Hook Form, Lucide React.
- **Development Tools**: Replit-specific plugins, Cartographer.
- **Browser APIs**: Web Speech API (text-to-speech).