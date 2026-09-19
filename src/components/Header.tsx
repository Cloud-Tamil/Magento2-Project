import React, { useState } from 'react';
import { Download, Terminal, Layers, FileCode, Check, RefreshCw, Activity } from 'lucide-react';
import JSZip from 'jszip';
import { PROJECT_FILES, PROJECT_NAME, PROJECT_VERSION, PHP_VERSION } from '../data/projectData';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  fileCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, fileCount }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setDownloading(true);
      const zip = new JSZip();

      // Add all project files into the zip
      for (const file of PROJECT_FILES) {
        // Strip out initial magento2-project/ to keep clean folder in zip or keep as folder
        const cleanPath = file.path.replace(/^magento2-project\//, '');
        zip.file(`magento2-project/${cleanPath}`, file.content);
      }

      // Add basic placeholder files for gitkeep
      zip.file('magento2-project/src/public/.gitkeep', '');
      zip.file('magento2-project/volumes/db/.gitkeep', '');
      zip.file('magento2-project/volumes/opensearch/.gitkeep', '');
      zip.file('magento2-project/volumes/redis/.gitkeep', '');
      zip.file('magento2-project/volumes/rabbitmq/.gitkeep', '');

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'magento2-automated-docker.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to generate ZIP archive:', err);
    } finally {
      setDownloading(false);
    }
  };

  const navItems = [
    { id: 'explorer', label: 'Code Explorer', icon: FileCode, count: fileCount },
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'pipeline', label: 'Automation Pipeline', icon: Terminal },
    { id: 'configurator', label: '.env Generator', icon: RefreshCw },
    { id: 'cheatsheet', label: 'Commands', icon: Terminal },
    { id: 'workload', label: 'Workload & Testing', icon: Activity },
    { id: 'docs', label: 'Documentation', icon: FileCode },
  ];

  return (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 flex items-center justify-center text-white font-bold shadow-md">
              <span className="text-xl tracking-wider">M</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-stone-900 tracking-tight">{PROJECT_NAME}</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                  Magento {PROJECT_VERSION}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200 rounded-full">
                  PHP {PHP_VERSION} FPM
                </span>
              </div>
              <p className="text-xs text-stone-700 hidden sm:block">
                Automated Zero-Touch Dockerized Orchestration Platform
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3">
            <button
              id="download-full-project-zip-btn"
              onClick={handleDownloadZip}
              disabled={downloading}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-xs cursor-pointer ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-900 hover:bg-stone-800 text-white active:scale-95'
              }`}
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Packaging ZIP...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Project ZIP</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar py-2 -mb-px">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-100 text-amber-900 shadow-2xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-700' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-amber-200/80 text-amber-950' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
