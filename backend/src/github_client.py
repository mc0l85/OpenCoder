"""GitHub integration client for repository management."""

import os
import shutil
import requests
from git import Repo, GitCommandError
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import urlparse
from src.config import config


class GitHubClient:
    """Client for GitHub repository operations and file management."""
    
    def __init__(self):
        """Initialize GitHub client with configuration."""
        self.access_token = config.github_token
        self.repos_dir = os.path.abspath(config.repos_directory)
        self.api_base_url = "https://api.github.com"
        
        # Create repos directory if it doesn't exist
        os.makedirs(self.repos_dir, exist_ok=True)
        
        self.headers = {}
        if self.access_token:
            self.headers['Authorization'] = f'token {self.access_token}'
    
    def parse_github_url(self, url: str) -> Tuple[str, str]:
        """Parse GitHub URL to extract owner and repository name.
        
        Args:
            url: GitHub repository URL
            
        Returns:
            Tuple of (owner, repo_name)
        """
        # Handle different GitHub URL formats
        if url.startswith('git@github.com:'):
            # SSH format: git@github.com:owner/repo.git
            path = url.replace('git@github.com:', '').replace('.git', '')
        elif 'github.com' in url:
            # HTTPS format: https://github.com/owner/repo
            parsed = urlparse(url)
            path = parsed.path.strip('/').replace('.git', '')
        else:
            raise ValueError(f"Invalid GitHub URL format: {url}")
        
        parts = path.split('/')
        if len(parts) != 2:
            raise ValueError(f"Invalid GitHub repository path: {path}")
        
        return parts[0], parts[1]
    
    def clone_repository(self, repo_url: str, force: bool = False) -> Dict[str, Any]:
        """Clone a GitHub repository to local storage.
        
        Args:
            repo_url: GitHub repository URL
            force: Whether to overwrite existing repository
            
        Returns:
            Dictionary with clone status and information
        """
        try:
            owner, repo_name = self.parse_github_url(repo_url)
            local_path = os.path.join(self.repos_dir, f"{owner}_{repo_name}")
            
            # Check if repository already exists
            if os.path.exists(local_path):
                if not force:
                    return {
                        'success': True,
                        'message': 'Repository already exists',
                        'path': local_path,
                        'owner': owner,
                        'repo': repo_name,
                        'existed': True
                    }
                else:
                    # Remove existing directory
                    shutil.rmtree(local_path)
            
            # Clone repository
            clone_url = f"https://github.com/{owner}/{repo_name}.git"
            if self.access_token:
                # Use token for authentication
                clone_url = f"https://{self.access_token}@github.com/{owner}/{repo_name}.git"
            
            repo = Repo.clone_from(clone_url, local_path)
            
            return {
                'success': True,
                'message': 'Repository cloned successfully',
                'path': local_path,
                'owner': owner,
                'repo': repo_name,
                'branch': repo.active_branch.name,
                'commit': repo.head.commit.hexsha[:8],
                'existed': False
            }
        
        except GitCommandError as e:
            return {
                'success': False,
                'error': f'Git error: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to clone repository: {str(e)}'
            }
    
    def get_repository_info(self, owner: str, repo_name: str) -> Dict[str, Any]:
        """Get repository information from GitHub API.
        
        Args:
            owner: Repository owner
            repo_name: Repository name
            
        Returns:
            Repository information dictionary
        """
        try:
            url = f"{self.api_base_url}/repos/{owner}/{repo_name}"
            response = requests.get(url, headers=self.headers, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    'error': f'GitHub API error: {response.status_code}',
                    'message': response.text
                }
        
        except Exception as e:
            return {
                'error': f'Failed to fetch repository info: {str(e)}'
            }
    
    def list_local_repositories(self) -> List[Dict[str, Any]]:
        """List all locally cloned repositories.
        
        Returns:
            List of repository information dictionaries
        """
        repos = []
        
        try:
            for item in os.listdir(self.repos_dir):
                repo_path = os.path.join(self.repos_dir, item)
                if os.path.isdir(repo_path) and os.path.exists(os.path.join(repo_path, '.git')):
                    try:
                        repo = Repo(repo_path)
                        
                        # Parse owner and repo name from directory name
                        if '_' in item:
                            owner, repo_name = item.split('_', 1)
                        else:
                            owner, repo_name = 'unknown', item
                        
                        repos.append({
                            'owner': owner,
                            'repo': repo_name,
                            'path': repo_path,
                            'branch': repo.active_branch.name if repo.active_branch else 'unknown',
                            'commit': repo.head.commit.hexsha[:8] if repo.head.commit else 'unknown',
                            'last_modified': os.path.getmtime(repo_path)
                        })
                    
                    except Exception as e:
                        # Skip invalid repositories
                        continue
        
        except Exception as e:
            pass
        
        return sorted(repos, key=lambda x: x.get('last_modified', 0), reverse=True)
    
    def get_file_tree(self, repo_path: str, max_depth: int = 10) -> List[Dict[str, Any]]:
        """Get file tree structure of a repository.
        
        Args:
            repo_path: Path to local repository
            max_depth: Maximum directory depth to traverse
            
        Returns:
            List of file/directory information
        """
        if not os.path.exists(repo_path):
            return []
        
        file_tree = []
        allowed_extensions = config.get('filesystem.allowed_extensions', [])
        
        def should_include_file(file_path: str) -> bool:
            """Check if file should be included based on extension."""
            if not allowed_extensions:
                return True
            
            _, ext = os.path.splitext(file_path)
            return ext.lower() in allowed_extensions
        
        def traverse_directory(dir_path: str, relative_path: str = "", depth: int = 0):
            """Recursively traverse directory structure."""
            if depth > max_depth:
                return
            
            try:
                items = sorted(os.listdir(dir_path))
                
                for item in items:
                    # Skip hidden files and common ignore patterns
                    if item.startswith('.') and item not in ['.gitignore', '.env']:
                        continue
                    if item in ['node_modules', '__pycache__', '.git', 'venv', 'env']:
                        continue
                    
                    item_path = os.path.join(dir_path, item)
                    item_relative = os.path.join(relative_path, item) if relative_path else item
                    
                    if os.path.isdir(item_path):
                        file_tree.append({
                            'name': item,
                            'path': item_relative,
                            'type': 'directory',
                            'size': None
                        })
                        traverse_directory(item_path, item_relative, depth + 1)
                    
                    elif os.path.isfile(item_path) and should_include_file(item):
                        try:
                            size = os.path.getsize(item_path)
                            file_tree.append({
                                'name': item,
                                'path': item_relative,
                                'type': 'file',
                                'size': size
                            })
                        except OSError:
                            # Skip files that can't be accessed
                            continue
            
            except PermissionError:
                # Skip directories without permission
                pass
        
        traverse_directory(repo_path)
        return file_tree
    
    def read_file(self, repo_path: str, file_path: str) -> Dict[str, Any]:
        """Read content of a file in the repository.
        
        Args:
            repo_path: Path to local repository
            file_path: Relative path to file within repository
            
        Returns:
            File content and metadata
        """
        full_path = os.path.join(repo_path, file_path)
        
        # Security check: ensure file is within repository
        if not os.path.abspath(full_path).startswith(os.path.abspath(repo_path)):
            return {
                'success': False,
                'error': 'File path outside repository'
            }
        
        if not os.path.exists(full_path):
            return {
                'success': False,
                'error': 'File not found'
            }
        
        if not os.path.isfile(full_path):
            return {
                'success': False,
                'error': 'Path is not a file'
            }
        
        try:
            # Check file size
            max_size = config.get('filesystem.max_file_size', 10) * 1024 * 1024  # MB to bytes
            file_size = os.path.getsize(full_path)
            
            if file_size > max_size:
                return {
                    'success': False,
                    'error': f'File too large ({file_size} bytes, max {max_size} bytes)'
                }
            
            # Try to read as text
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                return {
                    'success': True,
                    'content': content,
                    'size': file_size,
                    'encoding': 'utf-8',
                    'binary': False
                }
            
            except UnicodeDecodeError:
                # File is binary
                return {
                    'success': False,
                    'error': 'Binary file not supported for editing'
                }
        
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to read file: {str(e)}'
            }
    
    def write_file(self, repo_path: str, file_path: str, content: str) -> Dict[str, Any]:
        """Write content to a file in the repository.
        
        Args:
            repo_path: Path to local repository
            file_path: Relative path to file within repository
            content: File content to write
            
        Returns:
            Write operation result
        """
        full_path = os.path.join(repo_path, file_path)
        
        # Security check: ensure file is within repository
        if not os.path.abspath(full_path).startswith(os.path.abspath(repo_path)):
            return {
                'success': False,
                'error': 'File path outside repository'
            }
        
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            # Write file
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return {
                'success': True,
                'message': 'File saved successfully',
                'size': len(content.encode('utf-8'))
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to write file: {str(e)}'
            }


# Global GitHub client instance
github_client = GitHubClient()

