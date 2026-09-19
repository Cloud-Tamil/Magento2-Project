import React, { useState } from 'react';
import { Copy, Check, Download, Info, Terminal, FileCode, CheckCircle2 } from 'lucide-react';
import { ProjectFile } from '../types';

interface CodeViewerProps {
  file: ProjectFile;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ file }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lines = file.content.split('\n');

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-100 rounded-none sm:rounded-r-xl overflow-hidden border-stone-800">
      {/* File Meta Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-stone-950/80 border-b border-stone-800 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-1.5 rounded-md bg-stone-800 text-stone-300">
            <FileCode className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <span className="font-mono text-sm font-semibold text-stone-200 truncate block">
              {file.path}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-stone-400">
              <span>{lines.length} lines</span>
              <span>•</span>
              <span className="uppercase font-mono text-[10px] px-1 bg-stone-800 rounded text-amber-400">
                {file.language}
              </span>
              <span>•</span>
              <span className="capitalize text-stone-400">{file.category}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="download-single-file-btn"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-md transition-colors cursor-pointer"
            title="Download this file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            id="copy-code-content-btn"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Purpose Explanation Banner */}
      <div className="px-4 py-2.5 bg-stone-900/90 border-b border-stone-800/80 flex items-start gap-2 text-xs text-stone-300">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-amber-400 font-medium">File Role: </strong>
          {file.purpose}
        </p>
      </div>

      {/* Code Text Area with Line Numbers */}
      <div className="flex-1 overflow-auto font-mono text-xs leading-relaxed bg-[#111215] select-text">
        <div className="flex min-w-full p-4">
          {/* Line Numbers */}
          <div className="select-none text-stone-600 text-right pr-4 border-r border-stone-800/70 shrink-0">
            {lines.map((_, i) => (
              <div key={i} className="h-5 leading-5 text-[11px] font-mono">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Actual Code Lines */}
          <div className="pl-4 flex-1 whitespace-pre overflow-x-auto text-stone-200">
            {lines.map((line, i) => {
              // Basic highlighting cues
              const isComment = line.trim().startsWith('#') || line.trim().startsWith('//') || line.trim().startsWith(';');
              const isKeyword = line.match(/^(FROM|RUN|COPY|WORKDIR|EXPOSE|USER|CMD|ENTRYPOINT|ENV|ARG|server|location|sub|backend|service|version)/);
              
              return (
                <div
                  key={i}
                  className={`h-5 leading-5 text-[11.5px] ${
                    isComment
                      ? 'text-stone-500 italic'
                      : isKeyword
                      ? 'text-amber-300 font-semibold'
                      : 'text-stone-200'
                  }`}
                >
                  {line || ' '}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
