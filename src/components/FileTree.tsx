import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  Terminal,
  Database,
  Search,
  Settings,
  ChevronRight,
  ChevronDown,
  Layers,
  Zap,
  Globe
} from 'lucide-react';
import { ProjectFile } from '../types';

interface FileTreeProps {
  files: ProjectFile[];
  selectedFile: ProjectFile;
  onSelectFile: (file: ProjectFile) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, selectedFile, onSelectFile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'magento2-project': true,
    'magento2-project/docker': true,
    'magento2-project/docker/scripts': true,
    'magento2-project/docker/nginx': true,
    'magento2-project/docker/php-fpm': true,
  });

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const getFileIcon = (file: ProjectFile) => {
    if (file.language === 'dockerfile') return <Zap className="w-4 h-4 text-sky-600 shrink-0" />;
    if (file.language === 'bash') return <Terminal className="w-4 h-4 text-emerald-600 shrink-0" />;
    if (file.category === 'database') return <Database className="w-4 h-4 text-blue-600 shrink-0" />;
    if (file.category === 'nginx') return <Globe className="w-4 h-4 text-teal-600 shrink-0" />;
    if (file.language === 'yaml') return <Layers className="w-4 h-4 text-amber-600 shrink-0" />;
    if (file.language === 'properties') return <Settings className="w-4 h-4 text-violet-600 shrink-0" />;
    return <FileCode className="w-4 h-4 text-stone-500 shrink-0" />;
  };

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch =
        file.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.purpose.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'all' || file.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [files, searchTerm, selectedCategory]);

  return (
    <div className="flex flex-col h-full bg-stone-50 border-r border-stone-200">
      {/* Search Header */}
      <div className="p-3 border-b border-stone-200 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            id="file-tree-search-input"
            type="text"
            placeholder="Search files, scripts, configs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-stone-900 placeholder:text-stone-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'core', label: 'Orchestration' },
            { id: 'scripts', label: 'Scripts' },
            { id: 'php', label: 'PHP' },
            { id: 'nginx', label: 'Web/Cache' },
            { id: 'database', label: 'Database' },
            { id: 'search', label: 'Search' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-stone-800 text-white font-semibold'
                  : 'bg-stone-200/70 text-stone-600 hover:bg-stone-300/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
        {filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-stone-400">No matching files found</div>
        ) : (
          filteredFiles.map((file) => {
            const isSelected = selectedFile.path === file.path;
            const dirParts = file.path.split('/');
            const fileName = dirParts.pop() || file.name;
            const dirPath = dirParts.join('/');

            return (
              <button
                key={file.path}
                id={`file-item-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
                onClick={() => onSelectFile(file)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-100/90 text-amber-950 font-semibold border-l-2 border-amber-600 pl-2'
                    : 'text-stone-700 hover:bg-stone-200/60'
                }`}
              >
                {getFileIcon(file)}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono font-medium text-[12px]">{fileName}</div>
                  <div className="truncate text-[10px] text-stone-600 font-sans">{dirPath}</div>
                </div>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-sm bg-stone-200/60 text-stone-700 font-mono shrink-0">
                  {file.language}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-stone-200 bg-stone-100/60 text-[11px] text-stone-700 flex items-center justify-between">
        <span>Showing {filteredFiles.length} files</span>
        <span className="font-mono text-stone-700 font-medium">magento2-project/</span>
      </div>
    </div>
  );
};
