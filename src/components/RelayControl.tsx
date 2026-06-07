/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RelayConfig, ButtonStyleVariation } from '../types';
import { Lightbulb, Power, Sliders, ToggleLeft } from 'lucide-react';

interface RelayControlProps {
  relays: RelayConfig[];
  styleVariation: ButtonStyleVariation;
  setStyleVariation: (style: ButtonStyleVariation) => void;
  onToggleRelay: (id: number, state: boolean) => void;
  mqttStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export const RelayControl: React.FC<RelayControlProps> = ({
  relays,
  styleVariation,
  setStyleVariation,
  onToggleRelay,
  mqttStatus
}) => {
  return (
    <div className="bg-immersive-card border border-[#1e293b] rounded-xl relative overflow-hidden glow-border-custom flex flex-col h-full justify-between">
      {/* Decorative subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.1] pointer-events-none"></div>

      {/* Accent Header */}
      <div className="bg-immersive-header px-5 py-4 border-b border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-lime-brand tracking-widest">AKSES PANEL</span>
            <span className="w-1.5 h-1.5 rounded-full bg-lime-brand animate-pulse"></span>
          </div>
          <h2 className="text-base font-bold text-white mt-1 leading-none">Kontrol Lampu Relay</h2>
        </div>

        {/* Style Variation Selector */}
        <div className="flex bg-[#121924] p-0.5 rounded border border-zinc-800/80 text-[10px] font-semibold self-start sm:self-center">
          <button
            id="btn-var-neon"
            onClick={() => setStyleVariation('neon-cyber')}
            className={`px-3 py-1.5 rounded text-[11px] transition-all cursor-pointer ${
              styleVariation === 'neon-cyber'
                ? 'bg-lime-brand/10 text-lime-brand border border-lime-brand/20 font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Cyber Glow
          </button>
          <button
            id="btn-var-tactile"
            onClick={() => setStyleVariation('tactile-toggle')}
            className={`px-3 py-1.5 rounded text-[11px] transition-all cursor-pointer ${
              styleVariation === 'tactile-toggle'
                ? 'bg-lime-brand/10 text-lime-brand border border-lime-brand/20 font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Tactile Toggle
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-center relative z-10">
        {mqttStatus !== 'connected' && (
          <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl p-3.5 text-xs flex items-start gap-2.5">
            <span className="relative flex h-2 w-2 mt-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
            <div>
              <strong className="font-semibold block text-[11px] uppercase tracking-wider mb-0.5">Broker Belum Terhubung:</strong>
              Data status saat ini hanya tersimpan lokal di server. Silakan hubungkan ke MQTT Broker untuk sinkronisasi perangkat keras ESP8266.
            </div>
          </div>
        )}

        {/* Grid of 4 Relays */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {relays.map((relay) => {
            const isActive = relay.state;
            
            return (
              <div
                key={relay.id}
                className={`border rounded-xl p-4 transition-all duration-300 relative group overflow-hidden ${
                  isActive
                    ? 'bg-[#162235]/60 border-lime-brand/40 shadow-[0_0_20px_rgba(127,255,0,0.06)]'
                    : 'bg-[#101726]/80 border-[#1e293b] hover:border-[#334155]'
                }`}
              >
                {/* Card visual accent glow active */}
                {isActive && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-lime-brand/10 rounded-full blur-3xl -mr-6 -mt-6 pointer-events-none"></div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {/* Status Bulb Icon */}
                    <div
                      className={`p-2.5 rounded-lg border transition-all duration-300 ${
                        isActive
                          ? 'bg-lime-brand/20 border-lime-brand/40 text-lime-brand shadow-[0_0_15px_rgba(127,255,0,0.2)]'
                          : 'bg-[#0d1421] border-[#1e293b] text-zinc-500'
                      }`}
                    >
                      <Lightbulb className={`h-5 w-5 ${isActive ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-lime-brand transition-colors text-sm sm:text-base">
                        {relay.name}
                      </h3>
                      <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                        TOPIC: {relay.topic}
                      </p>
                    </div>
                  </div>

                  {/* Micro Indicator Dot */}
                  <div className="flex items-center space-x-1.5 bg-[#0a0f18] border border-[#1e293b] px-2 py-1 rounded">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isActive ? 'bg-lime-brand animate-pulse' : 'bg-zinc-650'
                      }`}
                    ></span>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${isActive ? 'text-lime-brand' : 'text-zinc-500'}`}>
                      {isActive ? "ACTIVE" : "OFF"}
                    </span>
                  </div>
                </div>

                {/* VARIATION A: NEON CYBER */}
                {styleVariation === 'neon-cyber' ? (
                  <button
                    id={`btn-cyber-${relay.id}`}
                    onClick={() => onToggleRelay(relay.id, relay.state)}
                    className={`w-full py-2.5 px-4 rounded font-mono text-[10px] font-bold uppercase tracking-widest flex items-center justify-center space-x-2 transition-all duration-350 cursor-pointer border ${
                      isActive
                        ? 'bg-lime-brand text-black border-lime-brand shadow-[0_0_20px_rgba(127,255,0,0.3)] hover:scale-[1.01]'
                        : 'bg-[#121924] text-zinc-400 hover:text-white border-[#1e293b] hover:border-[#334155]'
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" />
                    <span>{isActive ? 'MATIKAN' : 'NYALAKAN'} RELAY</span>
                  </button>
                ) : (
                  /* VARIATION B: TACTILE TOGGLE */
                  <div 
                    onClick={() => onToggleRelay(relay.id, relay.state)}
                    className="w-full bg-[#121924] border border-[#1e293b] p-3 rounded flex items-center justify-between cursor-pointer hover:border-[#334155] transition-all select-none"
                  >
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">Toggle Saklar:</span>
                    <div
                      className={`w-12 h-6 rounded-full p-0.5 transition-all duration-300 flex items-center ${
                        isActive ? 'bg-lime-brand/20 border border-lime-brand/30 justify-end' : 'bg-[#0d1421] border border-[#1e293b] justify-start'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full transition-all duration-300 shadow-md ${
                          isActive ? 'bg-lime-brand border border-lime-brand/50' : 'bg-zinc-650'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
