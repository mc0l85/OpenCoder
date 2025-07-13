"""OpenRouter.ai API client for AI-powered code assistance."""

import requests
import json
from typing import List, Dict, Any, Optional
from src.config import config


class OpenRouterClient:
    """Client for interacting with OpenRouter.ai API."""
    
    def __init__(self):
        """Initialize OpenRouter client with configuration."""
        self.api_key = config.openrouter_api_key
        self.base_url = config.openrouter_base_url
        self.default_model = config.openrouter_model
        self.max_tokens = config.get('openrouter.max_tokens', 4096)
        self.temperature = config.get('openrouter.temperature', 0.7)
        
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5000',  # Required by OpenRouter
            'X-Title': 'Web Agent IDE'  # Optional but recommended
        }
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        stream: bool = False
    ) -> Dict[str, Any]:
        """Send chat completion request to OpenRouter.
        
        Args:
            messages: List of message objects with 'role' and 'content'
            model: Model to use (defaults to configured model)
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature
            stream: Whether to stream the response
            
        Returns:
            API response as dictionary
        """
        if not self.api_key:
            raise ValueError("OpenRouter API key not configured")
        
        payload = {
            'model': model or self.default_model,
            'messages': messages,
            'max_tokens': max_tokens or self.max_tokens,
            'temperature': temperature or self.temperature,
            'stream': stream
        }
        
        try:
            response = requests.post(
                f'{self.base_url}/chat/completions',
                headers=self.headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            raise Exception(f"OpenRouter API request failed: {str(e)}")
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse OpenRouter API response: {str(e)}")
    
    def get_models(self) -> List[Dict[str, Any]]:
        """Get list of available models from OpenRouter.
        
        Returns:
            List of model information dictionaries
        """
        try:
            response = requests.get(
                f'{self.base_url}/models',
                headers=self.headers,
                timeout=30
            )
            response.raise_for_status()
            return response.json().get('data', [])
        
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch models: {str(e)}")
    
    def create_system_message(self, context: Optional[str] = None) -> Dict[str, str]:
        """Create system message with optional code context.
        
        Args:
            context: Additional context about current code/repository
            
        Returns:
            System message dictionary
        """
        system_prompt = config.get('chat.system_prompt', 
            "You are a helpful coding assistant integrated into a web-based IDE.")
        
        if context:
            system_prompt += f"\n\nCurrent context:\n{context}"
        
        return {
            'role': 'system',
            'content': system_prompt
        }
    
    def format_code_context(
        self,
        current_file: Optional[str] = None,
        file_content: Optional[str] = None,
        file_tree: Optional[List[str]] = None,
        selected_text: Optional[str] = None
    ) -> str:
        """Format code context for AI assistant.
        
        Args:
            current_file: Path of currently open file
            file_content: Content of current file
            file_tree: List of files in repository
            selected_text: Currently selected text in editor
            
        Returns:
            Formatted context string
        """
        context_parts = []
        
        if current_file:
            context_parts.append(f"Current file: {current_file}")
        
        if file_tree:
            context_parts.append(f"Repository structure:\n" + "\n".join(file_tree[:20]))
            if len(file_tree) > 20:
                context_parts.append(f"... and {len(file_tree) - 20} more files")
        
        if selected_text:
            context_parts.append(f"Selected text:\n```\n{selected_text}\n```")
        elif file_content:
            # Include first 100 lines of file content if no selection
            lines = file_content.split('\n')
            if len(lines) > 100:
                content_preview = '\n'.join(lines[:100]) + '\n... (truncated)'
            else:
                content_preview = file_content
            context_parts.append(f"File content:\n```\n{content_preview}\n```")
        
        return "\n\n".join(context_parts)


# Global OpenRouter client instance
openrouter_client = OpenRouterClient()

