import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, GitBranch, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FileExplorer = ({ onFileSelect, currentRepo, onRefresh }) => {
  const [fileTree, setFileTree] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (currentRepo) {
      fetchFileTree();
    }
  }, [currentRepo]);

  const fetchFileTree = async () => {
    if (!currentRepo) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/files/tree', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setFileTree(data.file_tree || []);
      } else {
        console.error('Failed to fetch file tree');
      }
    } catch (error) {
      console.error('Error fetching file tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderPath) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (file) => {
    if (file.type === 'file') {
      setSelectedFile(file.path);
      onFileSelect(file);
    } else {
      toggleFolder(file.path);
    }
  };

  const buildFileTree = (files) => {
    const tree = {};
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            path: parts.slice(0, index + 1).join('/'),
            type: index === parts.length - 1 ? file.type : 'directory',
            size: file.size,
            children: {}
          };
        }
        current = current[part].children;
      });
    });
    
    return tree;
  };

  const renderTreeNode = (node, depth = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;
    const hasChildren = Object.keys(node.children).length > 0;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
            isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleFileClick(node)}
        >
          {node.type === 'directory' ? (
            <>
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4 mr-1" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-1" />
                )
              ) : (
                <div className="w-4 h-4 mr-1" />
              )}
              <Folder className="w-4 h-4 mr-2 text-blue-500" />
            </>
          ) : (
            <>
              <div className="w-4 h-4 mr-1" />
              <File className="w-4 h-4 mr-2 text-gray-500" />
            </>
          )}
          <span className="text-sm truncate">{node.name}</span>
          {node.type === 'file' && node.size && (
            <span className="text-xs text-gray-400 ml-auto">
              {formatFileSize(node.size)}
            </span>
          )}
        </div>
        
        {node.type === 'directory' && isExpanded && hasChildren && (
          <div>
            {Object.values(node.children)
              .sort((a, b) => {
                if (a.type !== b.type) {
                  return a.type === 'directory' ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
              })
              .map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const tree = buildFileTree(fileTree);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Explorer
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchFileTree();
              onRefresh?.();
            }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {currentRepo && (
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <GitBranch className="w-3 h-3 mr-1" />
            <span className="truncate">
              {currentRepo.owner}/{currentRepo.repo}
            </span>
          </div>
        )}
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
            Loading files...
          </div>
        ) : !currentRepo ? (
          <div className="p-4 text-center text-gray-500">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No repository selected</p>
            <p className="text-xs mt-1">Clone a repository to start</p>
          </div>
        ) : fileTree.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files found</p>
          </div>
        ) : (
          <div className="py-2">
            {Object.values(tree)
              .sort((a, b) => {
                if (a.type !== b.type) {
                  return a.type === 'directory' ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
              })
              .map(node => renderTreeNode(node))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;

