"""File operations API routes."""

from flask import Blueprint, request, jsonify, session
from src.github_client import github_client

files_bp = Blueprint('files', __name__)


@files_bp.route('/files/tree', methods=['GET'])
def get_file_tree():
    """Get file tree structure of current repository."""
    try:
        current_repo = session.get('current_repo')
        if not current_repo:
            return jsonify({'error': 'No repository selected'}), 400
        
        repo_path = current_repo['path']
        max_depth = request.args.get('max_depth', 10, type=int)
        
        file_tree = github_client.get_file_tree(repo_path, max_depth=max_depth)
        
        return jsonify({
            'file_tree': file_tree,
            'repository': current_repo
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get file tree: {str(e)}'}), 500


@files_bp.route('/files/content', methods=['GET'])
def get_file_content():
    """Get content of a specific file."""
    try:
        current_repo = session.get('current_repo')
        if not current_repo:
            return jsonify({'error': 'No repository selected'}), 400
        
        file_path = request.args.get('path')
        if not file_path:
            return jsonify({'error': 'File path is required'}), 400
        
        repo_path = current_repo['path']
        result = github_client.read_file(repo_path, file_path)
        
        if result['success']:
            return jsonify({
                'content': result['content'],
                'size': result['size'],
                'encoding': result['encoding'],
                'file_path': file_path,
                'repository': current_repo
            })
        else:
            return jsonify(result), 400
    
    except Exception as e:
        return jsonify({'error': f'Failed to read file: {str(e)}'}), 500


@files_bp.route('/files/save', methods=['POST'])
def save_file():
    """Save content to a file."""
    try:
        current_repo = session.get('current_repo')
        if not current_repo:
            return jsonify({'error': 'No repository selected'}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        file_path = data.get('path')
        content = data.get('content')
        
        if not file_path:
            return jsonify({'error': 'File path is required'}), 400
        
        if content is None:
            return jsonify({'error': 'File content is required'}), 400
        
        repo_path = current_repo['path']
        result = github_client.write_file(repo_path, file_path, content)
        
        if result['success']:
            return jsonify({
                'message': result['message'],
                'size': result['size'],
                'file_path': file_path,
                'repository': current_repo
            })
        else:
            return jsonify(result), 400
    
    except Exception as e:
        return jsonify({'error': f'Failed to save file: {str(e)}'}), 500


@files_bp.route('/files/create', methods=['POST'])
def create_file():
    """Create a new file."""
    try:
        current_repo = session.get('current_repo')
        if not current_repo:
            return jsonify({'error': 'No repository selected'}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        file_path = data.get('path')
        content = data.get('content', '')
        
        if not file_path:
            return jsonify({'error': 'File path is required'}), 400
        
        repo_path = current_repo['path']
        
        # Check if file already exists
        import os
        full_path = os.path.join(repo_path, file_path)
        if os.path.exists(full_path):
            return jsonify({'error': 'File already exists'}), 400
        
        result = github_client.write_file(repo_path, file_path, content)
        
        if result['success']:
            return jsonify({
                'message': 'File created successfully',
                'size': result['size'],
                'file_path': file_path,
                'repository': current_repo
            })
        else:
            return jsonify(result), 400
    
    except Exception as e:
        return jsonify({'error': f'Failed to create file: {str(e)}'}), 500


@files_bp.route('/files/delete', methods=['DELETE'])
def delete_file():
    """Delete a file."""
    try:
        current_repo = session.get('current_repo')
        if not current_repo:
            return jsonify({'error': 'No repository selected'}), 400
        
        file_path = request.args.get('path')
        if not file_path:
            return jsonify({'error': 'File path is required'}), 400
        
        repo_path = current_repo['path']
        import os
        full_path = os.path.join(repo_path, file_path)
        
        # Security check: ensure file is within repository
        if not os.path.abspath(full_path).startswith(os.path.abspath(repo_path)):
            return jsonify({'error': 'File path outside repository'}), 400
        
        if not os.path.exists(full_path):
            return jsonify({'error': 'File not found'}), 404
        
        if not os.path.isfile(full_path):
            return jsonify({'error': 'Path is not a file'}), 400
        
        os.remove(full_path)
        
        return jsonify({
            'message': 'File deleted successfully',
            'file_path': file_path,
            'repository': current_repo
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to delete file: {str(e)}'}), 500


@files_bp.route('/files/search', methods=['GET'])
def search_files():
    """Search for files by name or content."""
    try:
        current_repo = session.get('current_repo')
        if not current_repo:
            return jsonify({'error': 'No repository selected'}), 400
        
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({'error': 'Search query is required'}), 400
        
        search_type = request.args.get('type', 'name')  # 'name' or 'content'
        max_results = request.args.get('max_results', 50, type=int)
        
        repo_path = current_repo['path']
        file_tree = github_client.get_file_tree(repo_path)
        
        results = []
        
        if search_type == 'name':
            # Search by filename
            for item in file_tree:
                if item['type'] == 'file' and query.lower() in item['name'].lower():
                    results.append(item)
                    if len(results) >= max_results:
                        break
        
        elif search_type == 'content':
            # Search by file content
            for item in file_tree:
                if item['type'] == 'file':
                    file_result = github_client.read_file(repo_path, item['path'])
                    if file_result['success'] and query.lower() in file_result['content'].lower():
                        results.append({
                            **item,
                            'matches': file_result['content'].lower().count(query.lower())
                        })
                        if len(results) >= max_results:
                            break
        
        return jsonify({
            'results': results,
            'query': query,
            'search_type': search_type,
            'total_found': len(results)
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to search files: {str(e)}'}), 500

