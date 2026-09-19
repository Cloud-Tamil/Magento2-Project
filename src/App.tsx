/**
 * MageForge: Automated Magento 2 Docker Platform
 * Interactive Orchestration Portal & Codebase Inspector
 */
import React, { useState } from 'react';
import { Header } from './components/Header';
import { FileTree } from './components/FileTree';
import { CodeViewer } from './components/CodeViewer';
import { EnvConfigurator } from './components/EnvConfigurator';
import { ArchitectureView } from './components/ArchitectureView';
import { AutomationTimeline } from './components/AutomationTimeline';
import { CommandCheatsheet } from './components/CommandCheatsheet';
import { DocumentationTab } from './components/DocumentationTab';
import { WorkloadTestingTab } from './components/WorkloadTestingTab';
import { PROJECT_FILES } from './data/projectData';
import { ProjectFile } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('explorer');
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(PROJECT_FILES[0]);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fileCount={PROJECT_FILES.length}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'explorer' && (
          <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-0 sm:p-4 lg:p-6">
            <div className="w-full md:w-80 lg:w-96 shrink-0 h-72 md:h-[calc(100vh-8.5rem)] rounded-none sm:rounded-l-xl overflow-hidden border-b md:border-b-0 border-stone-200">
              <FileTree
                files={PROJECT_FILES}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
              />
            </div>
            <div className="flex-1 h-[600px] md:h-[calc(100vh-8.5rem)] min-w-0">
              <CodeViewer file={selectedFile} />
            </div>
          </div>
        )}

        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'pipeline' && <AutomationTimeline />}
        {activeTab === 'configurator' && <EnvConfigurator />}
        {activeTab === 'cheatsheet' && <CommandCheatsheet />}
        {activeTab === 'workload' && <WorkloadTestingTab />}
        {activeTab === 'docs' && <DocumentationTab />}
      </main>

      {/* Clean Status Footer */}
      <footer className="border-t border-stone-200 bg-white py-3 px-4 sm:px-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-stone-800">MageForge Orchestrator</span>
            <span>•</span>
            <span>All 30+ files verified & ready for <code>docker compose up -d --build</code></span>
          </div>
          <div className="font-mono text-[11px] text-stone-500">
            Automated Zero-Touch Magento 2.4.7 Architecture
          </div>
        </div>
      </footer>
    </div>
  );
}
