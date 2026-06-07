/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, Wifi, WifiOff, Disc, Radio } from 'lucide-react';

interface NavbarProps {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  selectedBrokerId: string;
  onConnect: () => void;
  onDisconnect: () => void;
  serverUrl: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  selectedBrokerId,
  onConnect,
  onDisconnect,
  serverUrl,
}) => {
  return (
    <nav className="border-b border-lime-brand/20 bg-immersive-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-lime-brand flex items-center justify-center">
              <Cpu className="h-5 w-5 text-black" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-lime-brand">
              RELAY<span className="text-white">CTRL</span>
            </h1>
          </div>

          {/* MQTT Operations Control */}
          <div className="flex items-center space-x-4">
            {/* Live Connection Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-lime-brand/10 border border-lime-brand/30 rounded-full">
              <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-lime-brand animate-pulse' : status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[11px] uppercase tracking-widest font-semibold text-lime-brand">
                {status === 'connected' ? `Connected: ${serverUrl}` : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>

            {/* Broker Dropdown Selection */}
            <div className="relative hidden sm:block">
              <select
                aria-label="Pilih MQTT Broker"
                className="appearance-none bg-[#1a2230] border border-zinc-700 text-xs px-4 py-2 pr-10 rounded focus:border-lime-brand outline-none cursor-pointer text-zinc-300"
                value={selectedBrokerId}
                disabled
              >
                <option value="myqtthub">myqtthub.com</option>
                <option value="hivemq" disabled>HiveMQ (Soon)</option>
                <option value="emqx" disabled>EMQX Cloud (Soon)</option>
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none opacity-50 text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            {/* Quick Action Buttons */}
            {status === 'connected' || status === 'connecting' ? (
              <button
                id="btn-disconnect"
                onClick={onDisconnect}
                className="px-4 py-2 bg-red-900/30 border border-red-500/50 text-red-400 text-xs font-bold rounded hover:bg-red-900/50 uppercase tracking-tighter cursor-pointer transition-colors"
              >
                Putuskan
              </button>
            ) : (
              <button
                id="btn-connect"
                onClick={onConnect}
                className="px-4 py-2 bg-lime-brand/10 border border-lime-brand/30 text-lime-brand text-xs font-bold rounded hover:bg-lime-brand/20 uppercase tracking-tighter cursor-pointer transition-colors"
              >
                Hubungkan
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
