/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal, Trash2, CheckCircle, AlertTriangle, Mic, Info } from 'lucide-react';

interface ActivityLogProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs, onClearLogs }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto Scroll log list down when updates happen
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0; // The newest logs are pre-pended, but if they want to scroll they can
    }
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    if (filterType === 'all') return true;
    return log.type === filterType;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-3.5 w-3.5 text-lime-brand flex-shrink-0" />;
      case 'error':
        return <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />;
      case 'voice':
        return <Mic className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />;
      default:
        return <Info className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />;
    }
  };

  const getLogClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-lime-400/90 bg-lime-950/10 border-l border-lime-brand/35';
      case 'error':
        return 'text-red-400/90 bg-red-950/10 border-l border-red-500/35';
      case 'voice':
        return 'text-cyan-300 bg-cyan-950/10 border-l border-cyan-500/35';
      default:
        return 'text-zinc-300 bg-zinc-900/40 border-l border-zinc-700/60';
    }
  };

  return (
    <div className="bg-immersive-card border border-[#1e293b] rounded-xl relative overflow-hidden flex flex-col h-[300px] md:h-[350px] glow-border-custom">
      {/* Console Header */}
      <div className="bg-immersive-header px-5 py-3 border-b border-[#1e293b] flex items-center justify-between flex-shrink-0 select-none">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-lime-brand" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-white">Console Log Aktifitas</h2>
        </div>
        
        {/* Operations */}
        <div className="flex items-center space-x-3">
          {/* Micro Filter Selector */}
          <div className="flex bg-[#121924] p-0.5 rounded border border-[#1e293b] text-[9px] font-mono">
            {['all', 'voice', 'success', 'error'].map((type) => (
              <button
                id={`btn-log-filter-${type}`}
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2 py-1 rounded transition-all cursor-pointer capitalize ${
                  filterType === type 
                    ? 'bg-lime-brand/10 text-lime-brand font-bold border border-lime-brand/20' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {type === 'all' ? 'semua' : type === 'voice' ? 'suara' : type === 'success' ? 'sukses' : 'gagal'}
              </button>
            ))}
          </div>

          <button
            id="btn-clear-logs"
            onClick={onClearLogs}
            className="text-zinc-500 hover:text-red-400 p-1.5 hover:bg-[#121924] border border-[#1e293b] rounded transition-colors cursor-pointer"
            title="Bersihkan Log"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Screen Monitor Terminal Viewport */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 p-4 bg-[#0a0f18]/60 custom-scrollbar select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 italic text-center text-xs uppercase tracking-widest">
            Log kosong. Tidak ada aktivitas terekam.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div 
              key={log.id} 
              className={`p-2 rounded border border-[#1e293b] flex items-start gap-2.5 transition-all outline-none ${getLogClass(log.type)}`}
            >
              {/* Timestamp */}
              <span className="text-zinc-500 select-none text-[10px] mt-0.5">{log.timestamp}</span>
              
              {/* Event Icon indicator */}
              <div className="mt-[1px]">
                {getLogIcon(log.type)}
              </div>
              
              {/* Log Message text */}
              <span className="flex-1">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
