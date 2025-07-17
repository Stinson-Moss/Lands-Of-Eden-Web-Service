# Eden - Official Lands Of Eden Website

## Overview
[Eden](https://eden-z047.onrender.com/) is a full-stack application that implements secure cross-platform identity management between Discord and Roblox platforms. The system provides a seamless Single Sign-On (SSO) experience while maintaining high-level security standards.

![Eden Logo](frontend/src/assets/eden.svg)

## Table of Contents
- [Project Purpose](#-why-eden)
- [Features](#-features)
- [Technical Implementation](#️-technical-implementation)
- [Architecture Flow](#-architecture-flow)
- [Performance](#-performance)
- [Key Achievements](#-key-achievements)

## 🌟 Why Eden?

Many new players join our game, play briefly, and leave—often because essential content is locked behind joining a faction, which requires joining a Discord server and speaking to a community leader. This process is especially difficult for non-English speakers, creating a barrier to entry and limiting our community's growth.

The Eden Game Website solves this by providing the necessary infrastructure to bring community features directly to the player, wherever they are:

- Players can link their roblox accounts to their discord accounts, and make roblox actions without having to be in-game.

- Players can join factions and access content with a single click, no matter their language or location.
- The web service localizes content and removes the need for manual approval or Discord-only onboarding.
- Community management is unified across in-game, Discord, and web platforms.

With Eden, onboarding is fast and accessible, community leaders can manage groups from anywhere, and players enjoy a seamless, cross-platform experience. Eden breaks down platform barriers, making it easy for everyone to join, participate, and thrive.

---

## Quick Facts
- **Status**: In development
- **Primary Technologies**: React, TypeScript, Node.js, Express, PostgreSQL
- **Target Platforms**: Discord, Roblox
- **Main Purpose**: Cross-platform identity management for gaming communities

## 🚀 Features

### Authentication & Security
- [x] Bidirectional OAuth 2.0 authentication with Discord and Roblox
- [x] Cryptographically secure session management with random token generation
- [x] Secure cookie handling with HttpOnly, Secure, and SameSite attributes
- [x] Automatic token refresh mechanisms for both platforms
- [x] Protection against token expiration with graceful handling
- [x] Persistent account linking between Discord and Roblox
- [x] Secure logout and account unlinking functionality
- [ ] CSRF Protection (in development)
- [ ] Rate limiting (planned)
- [ ] Group management dashboard
- [x] Discord Server settings panel

### User Interface
- [x] Modern, responsive dark-themed design
- [x] Intuitive account connection workflow
- [x] Visual representation of linked accounts with avatars
- [x] Interactive confirmation dialogs for critical actions
- [x] Seamless navigation with React Router
- [x] Accessibility features (ARIA attributes, keyboard navigation)
- [x] Cross-browser compatibility
- [ ] Mobile-responsive design improvements (in progress)

### Backend Architecture
- [x] Optimized PostgreSQL database with normalized schema design
- [x] Connection pooling for efficient database management
- [x] SSL-encrypted database connections with CA certificates
- [x] Environment variable isolation for secure credential management
- [x] Comprehensive error handling with appropriate HTTP status codes
- [x] Stateless API design with session management via cookies
- [x] Sub-second response times for critical authentication operations
- [ ] API versioning (planned)

## 🛠️ Technical Implementation

### Frontend
- **Framework**: React with TypeScript for type-safe development
- **Styling**: Custom CSS modules with consistent design language
- **State Management**: React Context API and Hooks for efficient state handling
- **Routing**: React Router for seamless navigation
- **Authentication**: OAuth 2.0 flow implementation

### Backend
- **Server**: Node.js with Express for REST API endpoints
- **Database**: PostgreSQL with optimized schema for user identity mapping
- **Security**: 
  - Cryptographic hashing for secure token generation
  - HttpOnly cookies to prevent XSS attacks
  - SSL/TLS encryption for all data transmission
  - Environment-based configuration for secure deployment
- **API Integration**: 
  - Discord API for user authentication and profile data
  - Roblox API for account verification and user information

### Infrastructure
- **Configuration Management**: Secure credential handling via environment variables
- **Monitoring**: Error logging and performance tracking with third-party services like Aiven and Render

## 🔄 Architecture Flow
1. User authenticates with Discord OAuth 2.0
2. Backend securely stores Discord tokens and user information
3. User can then link their Roblox account through Roblox OAuth
4. System maintains persistent links between accounts with secure session management
5. User can seamlessly log in with Discord and retain their Roblox account link

## 📊 Performance
- Authentication operations complete in under 500ms
- Database queries optimized with proper indexing
- Token refresh operations handled asynchronously to prevent user experience disruption

## 🔑 Key Achievements
- Implemented complete bidirectional OAuth flows between two major platforms
- Created a secure, persistent user identity system with proper database design
- Developed an intuitive UI for managing cross-platform identities
- Established secure session management with proper encryption and cookie handling
- Built with scalability in mind to handle growing user base

***This project is still in development.*** 