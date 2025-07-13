# Web Agent Architecture

## Overview

The Web Agent is a self-hosted application that provides a web-based VS Code-like interface with AI-powered assistance for code editing and troubleshooting. It integrates with GitHub repositories and uses OpenRouter.ai for AI capabilities.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Flask Backend  │    │  External APIs  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Code Editor │ │◄──►│ │ File System │ │    │ │ OpenRouter  │ │
│ │ (Monaco)    │ │    │ │ Manager     │ │◄──►│ │ AI API      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Chat        │ │◄──►│ │ Chat API    │ │    │ │ GitHub API  │ │
│ │ Interface   │ │    │ │             │ │◄──►│ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │ File        │ │◄──►│ │ GitHub      │ │    │                 │
│ │ Explorer    │ │    │ │ Integration │ │    │                 │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### Frontend (React)
- **Code Editor**: Monaco Editor for VS Code-like editing experience
- **File Explorer**: Tree view of repository files and directories
- **Chat Interface**: Real-time chat with AI assistant
- **Repository Manager**: Interface for cloning and switching repositories

### Backend (Flask)
- **File System Manager**: Handles file operations (read, write, create, delete)
- **Chat API**: Manages conversations with OpenRouter.ai
- **GitHub Integration**: Clones repositories and manages Git operations
- **Configuration Manager**: Loads and manages application settings

### External Services
- **OpenRouter.ai**: Provides AI capabilities via Gemini 2.5 Pro
- **GitHub API**: Repository access and management

## Data Flow

1. **Repository Loading**:
   - User provides GitHub repository URL
   - Backend clones repository to local storage
   - File structure is indexed and sent to frontend

2. **File Editing**:
   - Frontend requests file content from backend
   - User edits file in Monaco Editor
   - Changes are saved back to backend file system

3. **AI Assistance**:
   - User sends message in chat interface
   - Backend includes relevant code context
   - OpenRouter.ai processes request and returns response
   - Response is displayed in chat interface

## API Endpoints

### File Operations
- `GET /api/files/tree` - Get repository file tree
- `GET /api/files/content` - Get file content
- `POST /api/files/save` - Save file content
- `POST /api/files/create` - Create new file
- `DELETE /api/files/delete` - Delete file

### Repository Management
- `POST /api/repo/clone` - Clone GitHub repository
- `GET /api/repo/status` - Get current repository status
- `POST /api/repo/switch` - Switch to different repository

### Chat Interface
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/clear` - Clear chat history

### Configuration
- `GET /api/config/status` - Get application status
- `POST /api/config/update` - Update configuration

## Security Considerations

- API keys stored in configuration file (not in environment variables)
- GitHub token with minimal required permissions
- File access restricted to cloned repositories
- Input validation for all file operations
- CORS configured for frontend-backend communication

## Deployment

The application is designed to run on Ubuntu 24.04 LXC containers with:
- Python 3.8+ for Flask backend
- Node.js 16+ for React frontend build
- Git for repository management
- YAML configuration file for settings

