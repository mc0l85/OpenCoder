import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import RepositoryManager from './components/RepositoryManager';
import ChatInterface from './components/ChatInterface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import './App.css';

function App() {
  const [currentRepo, setCurrentRepo] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    // Check if there's a current repository on app load
    fetchCurrentRepo();
  }, []);

  const fetchCurrentRepo = async () => {
    try {
      const response = await fetch('/api/repo/current', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.current_repo) {
          setCurrentRepo(data.current_repo);
        }
      }
    } catch (error) {
      console.error('Error fetching current repository:', error);
    }
  };

  const handleRepoChange = (repo) => {
    setCurrentRepo(repo);
    setCurrentFile(null); // Clear current file when switching repos
    setFileContent('');
    setSelectedText('');
  };

  const handleFileSelect = (file) => {
    setCurrentFile(file);
    setSelectedText(''); // Clear selection when switching files
  };

  const handleContentChange = (content) => {
    setFileContent(content);
  };

  const handleFileSave = (file, content) => {
    console.log('File saved:', file.path);
  };

  const handleRefresh = () => {
    // Refresh file explorer when needed
  };

  const handleTextSelection = (text) => {
    setSelectedText(text);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Web Agent IDE
          </h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {currentRepo ? (
              <span>{currentRepo.owner}/{currentRepo.repo}</span>
            ) : (
              <span>No repository selected</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
            <div className="h-full flex flex-col border-r border-gray-200 dark:border-gray-700">
              <Tabs defaultValue="explorer" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="explorer">Explorer</TabsTrigger>
                  <TabsTrigger value="repos">Repositories</TabsTrigger>
                </TabsList>
                
                <TabsContent value="explorer" className="flex-1 mt-0">
                  <FileExplorer
                    currentRepo={currentRepo}
                    onFileSelect={handleFileSelect}
                    onRefresh={handleRefresh}
                  />
                </TabsContent>
                
                <TabsContent value="repos" className="flex-1 mt-0">
                  <RepositoryManager
                    currentRepo={currentRepo}
                    onRepoChange={handleRepoChange}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Editor Area */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <CodeEditor
              currentFile={currentFile}
              onContentChange={handleContentChange}
              onSave={handleFileSave}
              onTextSelection={handleTextSelection}
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Sidebar - Chat */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <ChatInterface
              currentRepo={currentRepo}
              currentFile={currentFile}
              fileContent={fileContent}
              selectedText={selectedText}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default App;

