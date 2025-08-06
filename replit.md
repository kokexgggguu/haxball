# Overview

This is a Haxball room management dashboard - a full-stack web application that provides a real-time interface for monitoring and controlling a Haxball game room. The system includes player statistics tracking, chat monitoring, command execution, Discord integration, and live WebSocket updates. Built as a comprehensive admin panel for Haxball room operators to manage gameplay, track metrics, and interact with players.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui for consistent design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: Custom WebSocket hook for live data synchronization

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints with real-time WebSocket integration
- **Service Layer**: Modular service architecture with singleton patterns for Discord, Haxball, and WebSocket services
- **Error Handling**: Centralized error middleware with structured logging

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Provider**: Neon Database serverless PostgreSQL
- **Schema**: Comprehensive tables for users, players, games, chat messages, commands, room stats, Discord activity, and room settings
- **Migrations**: Drizzle Kit for database schema management

## Authentication & Authorization
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **Admin System**: Role-based access control with admin passwords
- **Player Tracking**: Persistent player identification and statistics

## External Service Integrations

### Haxball Integration
- **Purpose**: Core game room management and player interaction
- **Implementation**: Service wrapper for haxball-headless package (structure prepared)
- **Features**: Command execution, player management, game state tracking
- **Real-time Events**: Player joins/leaves, game results, chat messages

### Discord Bot Integration  
- **Purpose**: Bridge between Haxball room and Discord server
- **Bot Framework**: discord.js with gateway intents for message handling
- **Features**: Activity logging, game notifications, cross-platform chat
- **Configuration**: Environment-based token and channel management

### WebSocket Service
- **Purpose**: Real-time updates to dashboard clients
- **Implementation**: ws library with HTTP server integration
- **Message Types**: Chat updates, player events, game state changes, system notifications
- **Client Management**: Connection tracking with automatic reconnection handling

## Development & Deployment
- **Build System**: Vite for frontend, esbuild for backend bundling
- **Development**: Hot reload with Vite dev server and tsx for backend
- **Environment**: Replit-optimized with development banner integration
- **Type Safety**: Strict TypeScript configuration with path aliases
- **Code Quality**: Shared types between frontend and backend for consistency