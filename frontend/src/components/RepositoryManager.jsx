import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, RefreshCw, ExternalLink, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const RepositoryManager = ({ currentRepo, onRepoChange }) => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [showCloneForm, setShowCloneForm] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [cloneError, setCloneError] = useState('');

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/repo/list', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      } else {
        console.error('Failed to fetch repositories');
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const cloneRepository = async () => {
    if (!repoUrl.trim()) {
      setCloneError('Please enter a repository URL');
      return;
    }

    setCloning(true);
    setCloneError('');

    try {
      const response = await fetch('/api/repo/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          url: repoUrl.trim(),
          force: false
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Successfully cloned
        setRepoUrl('');
        setShowCloneForm(false);
        await fetchRepositories();
        
        // Switch to the newly cloned repository
        onRepoChange({
          owner: data.owner,
          repo: data.repo,
          path: data.path
        });
      } else {
        setCloneError(data.error || 'Failed to clone repository');
      }
    } catch (error) {
      setCloneError('Error cloning repository: ' + error.message);
    } finally {
      setCloning(false);
    }
  };

  const switchRepository = async (repo) => {
    try {
      const response = await fetch('/api/repo/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          owner: repo.owner,
          repo: repo.repo
        })
      });

      if (response.ok) {
        onRepoChange({
          owner: repo.owner,
          repo: repo.repo,
          path: repo.path
        });
      } else {
        console.error('Failed to switch repository');
      }
    } catch (error) {
      console.error('Error switching repository:', error);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Repositories
          </h3>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRepositories}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCloneForm(!showCloneForm)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Clone Form */}
        {showCloneForm && (
          <div className="space-y-2">
            <Input
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && cloneRepository()}
              className="text-sm"
            />
            {cloneError && (
              <p className="text-xs text-red-600">{cloneError}</p>
            )}
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={cloneRepository}
                disabled={cloning}
                className="flex-1"
              >
                <Download className={`w-3 h-3 mr-1 ${cloning ? 'animate-pulse' : ''}`} />
                {cloning ? 'Cloning...' : 'Clone'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCloneForm(false);
                  setRepoUrl('');
                  setCloneError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Repository List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
            Loading repositories...
          </div>
        ) : repositories.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No repositories</p>
            <p className="text-xs mt-1">Clone a repository to get started</p>
          </div>
        ) : (
          <div className="py-2">
            {repositories.map((repo, index) => {
              const isActive = currentRepo && 
                currentRepo.owner === repo.owner && 
                currentRepo.repo === repo.repo;
              
              return (
                <div
                  key={`${repo.owner}-${repo.repo}`}
                  className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 ${
                    isActive ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700' : ''
                  }`}
                  onClick={() => switchRepository(repo)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <GitBranch className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {repo.owner}/{repo.repo}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <span className="mr-3">
                              {repo.branch || 'main'}
                            </span>
                            <span className="mr-3">
                              {repo.commit || 'unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {repo.last_modified && (
                        <div className="flex items-center mt-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(repo.last_modified)}
                        </div>
                      )}
                    </div>
                    
                    {isActive && (
                      <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Current Repository Info */}
      {currentRepo && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p className="font-medium">Current Repository:</p>
            <p className="truncate">{currentRepo.owner}/{currentRepo.repo}</p>
            <a
              href={`https://github.com/${currentRepo.owner}/${currentRepo.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-1 text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View on GitHub
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepositoryManager;

