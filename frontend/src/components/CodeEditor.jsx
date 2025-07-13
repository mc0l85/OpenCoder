import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Save, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CodeEditor = ({ currentFile, onContentChange, onSave, onTextSelection }) => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', null
  const [isDirty, setIsDirty] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    if (currentFile) {
      loadFileContent();
    } else {
      setContent('');
      setOriginalContent('');
      setIsDirty(false);
    }
  }, [currentFile]);

  useEffect(() => {
    setIsDirty(content !== originalContent);
  }, [content, originalContent]);

  const loadFileContent = async () => {
    if (!currentFile) return;
    
    setLoading(true);
    setSaveStatus(null);
    
    try {
      const response = await fetch(`/api/files/content?path=${encodeURIComponent(currentFile.path)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setContent(data.content || '');
        setOriginalContent(data.content || '');
        setIsDirty(false);
      } else {
        const error = await response.json();
        console.error('Failed to load file:', error.error);
        setContent('// Error loading file: ' + error.error);
        setOriginalContent('');
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setContent('// Error loading file: ' + error.message);
      setOriginalContent('');
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!currentFile || !isDirty) return;
    
    setSaving(true);
    setSaveStatus(null);
    
    try {
      const response = await fetch('/api/files/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          path: currentFile.path,
          content: content
        })
      });
      
      if (response.ok) {
        setOriginalContent(content);
        setIsDirty(false);
        setSaveStatus('success');
        onSave?.(currentFile, content);
        
        // Clear success status after 2 seconds
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        const error = await response.json();
        console.error('Failed to save file:', error.error);
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditorChange = (value) => {
    setContent(value || '');
    onContentChange?.(value || '');
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Add keyboard shortcut for save (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveFile();
    });

    // Handle text selection changes
    editor.onDidChangeCursorSelection((e) => {
      const model = editor.getModel();
      if (model && onTextSelection) {
        const selectedText = model.getValueInRange(e.selection);
        onTextSelection(selectedText);
      }
    });
  };

  const getLanguageFromFileName = (fileName) => {
    if (!fileName) return 'plaintext';
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sh': 'shell',
      'dockerfile': 'dockerfile',
      'sql': 'sql',
      'xml': 'xml',
      'php': 'php',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin'
    };
    
    return languageMap[ext] || 'plaintext';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <FileText className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {currentFile ? currentFile.name : 'No file selected'}
          </span>
          {isDirty && (
            <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {saveStatus === 'success' && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Saved
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              Error
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={saveFile}
            disabled={!currentFile || !isDirty || saving}
          >
            <Save className={`w-4 h-4 mr-1 ${saving ? 'animate-pulse' : ''}`} />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* File Info */}
      {currentFile && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>{currentFile.path}</span>
            {currentFile.size && (
              <span>{formatFileSize(currentFile.size)}</span>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading file...
            </div>
          </div>
        ) : !currentFile ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No file selected</p>
              <p className="text-sm mt-1">Select a file from the explorer to start editing</p>
            </div>
          </div>
        ) : (
          <Editor
            height="100%"
            language={getLanguageFromFileName(currentFile.name)}
            value={content}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true
              },
              suggest: {
                showKeywords: true,
                showSnippets: true
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CodeEditor;

