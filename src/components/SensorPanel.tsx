/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Thermometer, Droplets, Compass, Wind, AlertCircle } from 'lucide-react';

interface SensorPanelProps {
  temperature: number;
  humidity: number;
}

export const SensorPanel: React.FC<SensorPanelProps> = ({ temperature, humidity }) => {
  // Determine temperature status label and color accent
  const getTempStatus = (temp: number) => {
    if (temp < 20) return { label: "DINGIN", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", bar: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" };
    if (temp <= 28) return { label: "NYAMAN", color: "text-lime-brand bg-lime-brand/10 border-lime-brand/20", bar: "bg-lime-brand shadow-[0_0_10px_rgba(127,255,0,0.5)]" };
    if (temp <= 35) return { label: "HANGAT", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", bar: "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]" };
    return { label: "PANAS", color: "text-red-500 bg-red-500/10 border-red-500/20", bar: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" };
  };

  // Determine humidity status label and color accent
  const getHumiStatus = (humi: number) => {
    if (humi < 40) return { label: "KERING", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", bar: "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" };
    if (humi <= 70) return { label: "OPTIMAL", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", bar: "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" };
    return { label: "LEMBAP", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", bar: "bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]" };
  };

  const tempInfo = getTempStatus(temperature);
  const humiInfo = getHumiStatus(humidity);

  // Scaled percentage for bar displays
  const tempPercent = Math.min(100, Math.max(0, ((temperature - 10) / 35) * 100)); // normalized between 10C and 45C
  const humiPercent = Math.min(100, Math.max(0, humidity));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Temperature Card Component */}
      <div className="bg-immersive-card border border-[#1e293b] rounded-xl p-5 glow-border-custom relative overflow-hidden flex flex-col justify-between h-[155px]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Thermometer className="h-28 w-28 text-white" />
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#121924] border border-[#1e293b] rounded-md text-lime-brand">
              <Thermometer className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">SUHU TELEMETRI</p>
              <h3 className="text-xs font-bold text-white mt-0.5">Suhu Ruangan</h3>
            </div>
          </div>
          
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border rounded uppercase tracking-wider ${tempInfo.color}`}>
            {tempInfo.label}
          </span>
        </div>

        <div className="my-3 flex items-baseline gap-1.5 relative z-10">
          <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tighter leading-none">
            {temperature.toFixed(1)}
          </span>
          <span className="text-lg font-bold text-lime-brand">°C</span>
        </div>

        <div className="w-full relative z-10">
          <div className="flex justify-between text-[9px] font-mono text-zinc-500 mb-1 leading-none uppercase">
            <span>Range: 10°C - 45°C</span>
            <span>Aktif</span>
          </div>
          <div className="w-full h-1.5 bg-[#0a0f18]/80 border border-[#1e293b] rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${tempInfo.bar}`}
              style={{ width: `${tempPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Humidity Card Component */}
      <div className="bg-immersive-card border border-[#1e293b] rounded-xl p-5 glow-border-custom relative overflow-hidden flex flex-col justify-between h-[155px]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Droplets className="h-28 w-28 text-white" />
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#121924] border border-[#1e293b] rounded-md text-cyan-400">
              <Droplets className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">KELEMBAPAN NISBI</p>
              <h3 className="text-xs font-bold text-white mt-0.5">Kelembapan Udara</h3>
            </div>
          </div>
          
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border rounded uppercase tracking-wider ${humiInfo.color}`}>
            {humiInfo.label}
          </span>
        </div>

        <div className="my-3 flex items-baseline gap-1.5 relative z-10">
          <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tighter leading-none">
            {humidity.toFixed(1)}
          </span>
          <span className="text-lg font-bold text-cyan-400">%</span>
        </div>

        <div className="w-full relative z-10">
          <div className="flex justify-between text-[9px] font-mono text-zinc-500 mb-1 leading-none uppercase">
            <span>Range: 0% - 100%</span>
            <span>Sensor OK</span>
          </div>
          <div className="w-full h-1.5 bg-[#0a0f18]/80 border border-[#1e293b] rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${humiInfo.bar}`}
              style={{ width: `${humiPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
