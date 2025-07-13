# Web Agent IDE - Deployment Guide

## Overview

The Web Agent IDE is a self-hosted application that provides a VS Code-like interface with AI-powered assistance for code editing and troubleshooting. It integrates with GitHub repositories and uses OpenRouter.ai for AI capabilities.

## Prerequisites

- Ubuntu 24.04 LXC container (or similar Linux environment)
- Python 3.8+ with pip
- Node.js 16+ with npm/pnpm
- Git
- Internet access

## Installation Steps

### 1. Clone the Application

```bash
git clone <your-web-agent-repo>
cd web-agent
```

### 2. Configure API Keys

Edit the `config.yaml` file and add your API keys:

```yaml
# OpenRouter.ai API Configuration
openrouter:
  api_key: "your_openrouter_api_key_here"  # Required for AI features
  base_url: "https://openrouter.ai/api/v1"
  default_model: "google/gemini-2.0-flash-exp:free"
  max_tokens: 4096
  temperature: 0.7

# GitHub Integration
github:
  access_token: "your_github_token_here"  # Optional, for private repos
  default_user: ""
  repos_directory: "./repos"

# Application Settings
app:
  host: "0.0.0.0"
  port: 5000
  debug: false
  secret_key: "your_secret_key_here"  # Change this to a random string
```

### 3. Set Up Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Set Up Frontend

```bash
cd ../frontend
npm install
# or
pnpm install
```

### 5. Start the Application

#### Development Mode

Terminal 1 (Backend):
```bash
cd backend
source venv/bin/activate
python src/main.py
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev --host
# or
pnpm run dev --host
```

#### Production Mode

Build the frontend:
```bash
cd frontend
npm run build
# or
pnpm run build
```

Copy built files to Flask static directory:
```bash
cp -r dist/* ../backend/src/static/
```

Start the Flask server:
```bash
cd ../backend
source venv/bin/activate
python src/main.py
```

## Configuration Details

### OpenRouter.ai API Key

1. Sign up at [OpenRouter.ai](https://openrouter.ai/)
2. Generate an API key
3. Add it to `config.yaml` under `openrouter.api_key`

### GitHub Access Token (Optional)

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `repo` scope
3. Add it to `config.yaml` under `github.access_token`

Note: GitHub token is only required for private repositories. Public repositories can be cloned without authentication.

### Secret Key

Generate a secure secret key for Flask sessions:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## Accessing the Application

- **Development**: http://localhost:5173 (frontend) + http://localhost:5000 (backend)
- **Production**: http://localhost:5000

## Features

### Repository Management
- Clone GitHub repositories (public and private)
- Browse repository file structure
- Switch between multiple repositories

### Code Editor
- VS Code-like editing experience with Monaco Editor
- Syntax highlighting for multiple languages
- File save functionality (Ctrl+S / Cmd+S)
- File creation and deletion

### AI Assistant
- Context-aware code assistance
- Chat interface with conversation history
- Code analysis and suggestions
- Integration with current file and selected text

## Troubleshooting

### "Unexpected end of JSON input" Error

This error typically occurs when:
1. OpenRouter API key is not configured
2. OpenRouter API is unreachable
3. Invalid API response format

**Solution**: Ensure your OpenRouter API key is correctly configured in `config.yaml`.

### Repository Cloning Fails

Common causes:
1. Invalid repository URL
2. Private repository without GitHub token
3. Network connectivity issues

**Solution**: 
- Verify the repository URL is correct
- For private repos, ensure GitHub token is configured
- Check network connectivity

### File Operations Fail

Possible causes:
1. File permissions
2. File size exceeds limit (default 10MB)
3. Binary file editing attempt

**Solution**:
- Check file permissions in the repos directory
- Adjust `filesystem.max_file_size` in config.yaml if needed
- Only text files are supported for editing

## Security Considerations

- Change the default secret key in production
- Use environment variables for sensitive configuration in production
- Restrict network access to the application as needed
- Regularly update dependencies

## Directory Structure

```
web-agent/
├── backend/                 # Flask backend
│   ├── src/
│   │   ├── main.py         # Main Flask application
│   │   ├── config.py       # Configuration management
│   │   ├── openrouter_client.py  # OpenRouter API client
│   │   ├── github_client.py      # GitHub integration
│   │   └── routes/         # API route handlers
│   ├── venv/               # Python virtual environment
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main application component
│   │   └── components/     # React components
│   ├── dist/               # Built frontend files
│   └── package.json        # Node.js dependencies
├── config.yaml             # Main configuration file
├── ARCHITECTURE.md         # System architecture documentation
└── DEPLOYMENT.md           # This file
```

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the architecture documentation
3. Check application logs for error details

