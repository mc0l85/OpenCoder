"""Chat API routes for AI-powered assistance."""

from flask import Blueprint, request, jsonify, session
from typing import List, Dict, Any
from src.openrouter_client import openrouter_client
from src.config import config

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/chat/message', methods=['POST'])
def send_message():
    """Send a message to the AI assistant and get a response."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        user_message = data.get('message', '').strip()
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        # Get optional context information
        current_file = data.get('current_file')
        file_content = data.get('file_content')
        file_tree = data.get('file_tree')
        selected_text = data.get('selected_text')
        
        # Get or initialize conversation history
        if 'chat_history' not in session:
            session['chat_history'] = []
        
        chat_history = session['chat_history']
        
        # Create context for the AI
        context = openrouter_client.format_code_context(
            current_file=current_file,
            file_content=file_content,
            file_tree=file_tree,
            selected_text=selected_text
        )
        
        # Prepare messages for API call
        messages = []
        
        # Add system message with context
        system_message = openrouter_client.create_system_message(context)
        messages.append(system_message)
        
        # Add conversation history (limit to recent messages)
        max_history = config.get('chat.max_history', 50)
        recent_history = chat_history[-max_history:] if len(chat_history) > max_history else chat_history
        messages.extend(recent_history)
        
        # Add current user message
        user_msg = {'role': 'user', 'content': user_message}
        messages.append(user_msg)
        
        # Call OpenRouter API
        response = openrouter_client.chat_completion(messages)
        
        # Extract assistant response
        if 'choices' in response and len(response['choices']) > 0:
            assistant_message = response['choices'][0]['message']['content']
            
            # Add messages to history
            chat_history.append(user_msg)
            chat_history.append({'role': 'assistant', 'content': assistant_message})
            session['chat_history'] = chat_history
            
            return jsonify({
                'response': assistant_message,
                'usage': response.get('usage', {}),
                'model': response.get('model', openrouter_client.default_model)
            })
        else:
            return jsonify({'error': 'No response from AI model'}), 500
    
    except Exception as e:
        return jsonify({'error': f'Failed to process message: {str(e)}'}), 500


@chat_bp.route('/chat/history', methods=['GET'])
def get_chat_history():
    """Get the current chat conversation history."""
    try:
        chat_history = session.get('chat_history', [])
        return jsonify({'history': chat_history})
    
    except Exception as e:
        return jsonify({'error': f'Failed to get chat history: {str(e)}'}), 500


@chat_bp.route('/chat/clear', methods=['DELETE'])
def clear_chat_history():
    """Clear the chat conversation history."""
    try:
        session['chat_history'] = []
        return jsonify({'message': 'Chat history cleared successfully'})
    
    except Exception as e:
        return jsonify({'error': f'Failed to clear chat history: {str(e)}'}), 500


@chat_bp.route('/chat/models', methods=['GET'])
def get_available_models():
    """Get list of available AI models."""
    try:
        models = openrouter_client.get_models()
        return jsonify({'models': models})
    
    except Exception as e:
        return jsonify({'error': f'Failed to fetch models: {str(e)}'}), 500


@chat_bp.route('/chat/config', methods=['GET'])
def get_chat_config():
    """Get current chat configuration."""
    try:
        return jsonify({
            'current_model': openrouter_client.default_model,
            'max_tokens': openrouter_client.max_tokens,
            'temperature': openrouter_client.temperature,
            'max_history': config.get('chat.max_history', 50)
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get chat config: {str(e)}'}), 500

