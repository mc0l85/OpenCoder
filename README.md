# Web Agent IDE

A self-hosted web-based IDE with AI-powered assistance for code editing and troubleshooting. Built with Flask (backend) and React (frontend), featuring GitHub integration and OpenRouter.ai for AI capabilities.

![Web Agent IDE Screenshot](screenshots/web-agent-ide.png)

## Features

### 🚀 Core Functionality
- **VS Code-like Editor**: Monaco Editor with syntax highlighting, themes, and keyboard shortcuts
- **GitHub Integration**: Clone and browse repositories directly in the IDE
- **AI Assistant**: Context-aware code assistance powered by OpenRouter.ai (Gemini 2.5 Pro)
- **File Management**: Create, edit, save, and delete files with real-time updates
- **Multi-Repository Support**: Switch between multiple cloned repositories

### 🎯 Key Capabilities
- **Repository Management**
  - Clone public and private GitHub repositories
  - Browse file tree structure
  - Switch between repositories seamlessly
  
- **Code Editor**
  - Syntax highlighting for 20+ programming languages
  - Auto-completion and IntelliSense
  - Find and replace functionality
  - Keyboard shortcuts (Ctrl+S for save, etc.)
  - Dark/light theme support

- **AI-Powered Assistance**
  - Context-aware code suggestions
  - Code analysis and debugging help
  - Chat interface with conversation history
  - Integration with current file and selected text
  - Support for multiple AI models via OpenRouter

### 🛠 Technical Stack
- **Backend**: Flask, Python 3.8+
- **Frontend**: React, TypeScript/JavaScript
- **Editor**: Monaco Editor (VS Code engine)
- **AI**: OpenRouter.ai API
- **Version Control**: Git integration
- **Styling**: Tailwind CSS, shadcn/ui components

## Quick Start

### Prerequisites
- Ubuntu 24.04 LXC container (or similar Linux environment)
- Python 3.8+ with pip
- Node.js 16+ with npm/pnpm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd web-agent
   ```

2. **Configure API keys**
   ```bash
   cp config.yaml.example config.yaml
   # Edit config.yaml with your API keys
   ```

3. **Set up backend**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Set up frontend**
   ```bash
   cd ../frontend
   pnpm install
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && source venv/bin/activate && python src/main.py
   
   # Terminal 2 - Frontend
   cd frontend && pnpm run dev --host
   ```

6. **Access the application**
   - Open http://localhost:5173 in your browser

## Configuration

### Required API Keys

#### OpenRouter.ai (Required for AI features)
1. Sign up at [OpenRouter.ai](https://openrouter.ai/)
2. Generate an API key
3. Add to `config.yaml`:
   ```yaml
   openrouter:
     api_key: "your_openrouter_api_key_here"
   ```

#### GitHub Token (Optional, for private repos)
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate token with `repo` scope
3. Add to `config.yaml`:
   ```yaml
   github:
     access_token: "your_github_token_here"
   ```

### Configuration File Structure

```yaml
# OpenRouter.ai API Configuration
openrouter:
  api_key: "your_openrouter_api_key_here"
  base_url: "https://openrouter.ai/api/v1"
  default_model: "google/gemini-2.0-flash-exp:free"
  max_tokens: 4096
  temperature: 0.7

# GitHub Integration
github:
  access_token: "your_github_token_here"
  repos_directory: "./repos"

# Application Settings
app:
  host: "0.0.0.0"
  port: 5000
  debug: false
  secret_key: "your_secret_key_here"

# File System Settings
filesystem:
  max_file_size: 10  # MB
  allowed_extensions:
    - ".py"
    - ".js"
    - ".jsx"
    - ".ts"
    - ".tsx"
    - ".html"
    - ".css"
    - ".json"
    - ".md"
    # ... more extensions

# Chat Settings
chat:
  max_history: 50
  system_prompt: |
    You are a helpful coding assistant integrated into a web-based IDE.
    You can help with code analysis, debugging, suggestions, and explanations.
```

## Usage Guide

### 1. Repository Management
- Click the "Repositories" tab in the left sidebar
- Click the "+" button to clone a new repository
- Enter a GitHub repository URL (e.g., `https://github.com/owner/repo`)
- Click "Clone" to download the repository

### 2. File Editing
- Select a repository from the Repositories tab
- Switch to the "Explorer" tab to browse files
- Click on any file to open it in the editor
- Edit the file and press Ctrl+S (or Cmd+S) to save

### 3. AI Assistant
- Use the chat interface on the right sidebar
- Ask questions about your code
- Select text in the editor for context-aware assistance
- The AI has access to your current file and repository structure

### 4. Keyboard Shortcuts
- `Ctrl+S` / `Cmd+S`: Save current file
- `Ctrl+F` / `Cmd+F`: Find in file
- `Ctrl+H` / `Cmd+H`: Find and replace
- `Enter`: Send chat message
- `Shift+Enter`: New line in chat

## API Endpoints

### Repository Management
- `POST /api/repo/clone` - Clone a repository
- `GET /api/repo/list` - List local repositories
- `POST /api/repo/switch` - Switch current repository
- `GET /api/repo/current` - Get current repository

### File Operations
- `GET /api/files/tree` - Get file tree structure
- `GET /api/files/content` - Get file content
- `POST /api/files/save` - Save file content
- `POST /api/files/create` - Create new file
- `DELETE /api/files/delete` - Delete file

### Chat Interface
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/clear` - Clear chat history
- `GET /api/chat/config` - Get chat configuration

## Architecture

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

## Deployment

### Development
```bash
# Backend
cd backend && source venv/bin/activate && python src/main.py

# Frontend
cd frontend && pnpm run dev --host
```

### Production
```bash
# Build frontend
cd frontend && pnpm run build

# Copy to Flask static directory
cp -r dist/* ../backend/src/static/

# Start Flask server
cd ../backend && source venv/bin/activate && python src/main.py
```

Access at: http://localhost:5000

## Troubleshooting

### Common Issues

**"Unexpected end of JSON input" Error**
- Ensure OpenRouter API key is configured in `config.yaml`
- Check network connectivity to OpenRouter.ai

**Repository cloning fails**
- Verify repository URL is correct
- For private repos, ensure GitHub token is configured
- Check network connectivity

**File operations fail**
- Check file permissions in repos directory
- Verify file size is under the limit (default 10MB)
- Ensure file type is supported for editing

### Debug Mode
Enable debug mode in `config.yaml`:
```yaml
app:
  debug: true
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the VS Code editing experience
- [OpenRouter.ai](https://openrouter.ai/) for AI model access
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling

## Support

For support and questions:
- Check the [Deployment Guide](DEPLOYMENT.md)
- Review the [Architecture Documentation](ARCHITECTURE.md)
- Open an issue on GitHub

