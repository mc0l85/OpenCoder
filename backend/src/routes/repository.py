"""Repository management API routes."""

from flask import Blueprint, request, jsonify, session
from src.github_client import github_client

repo_bp = Blueprint('repository', __name__)


@repo_bp.route('/repo/clone', methods=['POST'])
def clone_repository():
    """Clone a GitHub repository."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        repo_url = data.get('url', '').strip()
        if not repo_url:
            return jsonify({'error': 'Repository URL is required'}), 400
        
        force = data.get('force', False)
        
        result = github_client.clone_repository(repo_url, force=force)
        
        if result['success']:
            # Store current repository in session
            session['current_repo'] = {
                'owner': result['owner'],
                'repo': result['repo'],
                'path': result['path']
            }
            return jsonify(result)
        else:
            return jsonify(result), 400
    
    except Exception as e:
        return jsonify({'error': f'Failed to clone repository: {str(e)}'}), 500


@repo_bp.route('/repo/list', methods=['GET'])
def list_repositories():
    """List all locally cloned repositories."""
    try:
        repos = github_client.list_local_repositories()
        return jsonify({'repositories': repos})
    
    except Exception as e:
        return jsonify({'error': f'Failed to list repositories: {str(e)}'}), 500


@repo_bp.route('/repo/switch', methods=['POST'])
def switch_repository():
    """Switch to a different repository."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        owner = data.get('owner')
        repo_name = data.get('repo')
        
        if not owner or not repo_name:
            return jsonify({'error': 'Owner and repo name are required'}), 400
        
        # Find repository in local list
        repos = github_client.list_local_repositories()
        target_repo = None
        
        for repo in repos:
            if repo['owner'] == owner and repo['repo'] == repo_name:
                target_repo = repo
                break
        
        if not target_repo:
            return jsonify({'error': 'Repository not found locally'}), 404
        
        # Update session
        session['current_repo'] = {
            'owner': owner,
            'repo': repo_name,
            'path': target_repo['path']
        }
        
        return jsonify({
            'success': True,
            'message': 'Switched repository successfully',
            'repository': target_repo
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to switch repository: {str(e)}'}), 500


@repo_bp.route('/repo/current', methods=['GET'])
def get_current_repository():
    """Get current repository information."""
    try:
        current_repo = session.get('current_repo')
        if not current_repo:
            return jsonify({'current_repo': None})
        
        return jsonify({'current_repo': current_repo})
    
    except Exception as e:
        return jsonify({'error': f'Failed to get current repository: {str(e)}'}), 500


@repo_bp.route('/repo/info', methods=['GET'])
def get_repository_info():
    """Get detailed repository information."""
    try:
        current_repo = session.get('current_repo')
        if not current_repo:
            return jsonify({'error': 'No repository selected'}), 400
        
        owner = current_repo['owner']
        repo_name = current_repo['repo']
        
        # Get info from GitHub API
        info = github_client.get_repository_info(owner, repo_name)
        
        return jsonify({'info': info})
    
    except Exception as e:
        return jsonify({'error': f'Failed to get repository info: {str(e)}'}), 500

