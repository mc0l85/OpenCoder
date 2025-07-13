"""Configuration management for the Web Agent application."""

import os
import yaml
from typing import Dict, Any, Optional


class Config:
    """Configuration manager that loads settings from YAML file."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize configuration manager.
        
        Args:
            config_path: Path to configuration file. Defaults to config.yaml in project root.
        """
        if config_path is None:
            # Default to config.yaml in project root (two levels up from src/)
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            config_path = os.path.join(project_root, 'config.yaml')
        
        self.config_path = config_path
        self._config: Dict[str, Any] = {}
        self.load_config()
    
    def load_config(self) -> None:
        """Load configuration from YAML file."""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as file:
                self._config = yaml.safe_load(file) or {}
        except FileNotFoundError:
            print(f"Warning: Configuration file not found at {self.config_path}")
            self._config = {}
        except yaml.YAMLError as e:
            print(f"Error parsing configuration file: {e}")
            self._config = {}
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value using dot notation.
        
        Args:
            key: Configuration key in dot notation (e.g., 'openrouter.api_key')
            default: Default value if key not found
            
        Returns:
            Configuration value or default
        """
        keys = key.split('.')
        value = self._config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value
    
    def set(self, key: str, value: Any) -> None:
        """Set configuration value using dot notation.
        
        Args:
            key: Configuration key in dot notation
            value: Value to set
        """
        keys = key.split('.')
        config = self._config
        
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        
        config[keys[-1]] = value
    
    def save_config(self) -> None:
        """Save current configuration to YAML file."""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as file:
                yaml.dump(self._config, file, default_flow_style=False, indent=2)
        except Exception as e:
            print(f"Error saving configuration file: {e}")
    
    @property
    def openrouter_api_key(self) -> str:
        """Get OpenRouter API key."""
        return self.get('openrouter.api_key', '')
    
    @property
    def openrouter_base_url(self) -> str:
        """Get OpenRouter base URL."""
        return self.get('openrouter.base_url', 'https://openrouter.ai/api/v1')
    
    @property
    def openrouter_model(self) -> str:
        """Get default OpenRouter model."""
        return self.get('openrouter.default_model', 'google/gemini-2.0-flash-exp:free')
    
    @property
    def github_token(self) -> str:
        """Get GitHub access token."""
        return self.get('github.access_token', '')
    
    @property
    def repos_directory(self) -> str:
        """Get repositories directory."""
        return self.get('github.repos_directory', './repos')
    
    @property
    def app_host(self) -> str:
        """Get application host."""
        return self.get('app.host', '0.0.0.0')
    
    @property
    def app_port(self) -> int:
        """Get application port."""
        return self.get('app.port', 5000)
    
    @property
    def app_debug(self) -> bool:
        """Get debug mode setting."""
        return self.get('app.debug', False)
    
    @property
    def secret_key(self) -> str:
        """Get Flask secret key."""
        return self.get('app.secret_key', 'default_secret_key_change_me')


# Global configuration instance
config = Config()

