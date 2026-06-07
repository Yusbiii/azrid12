/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrokerConfig } from '../types';
import { Settings, Save, Wifi, EyeOff, Eye } from 'lucide-react';

interface SettingsPanelProps {
  config: BrokerConfig;
  onSaveConfig: (newConfig: BrokerConfig) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onSaveConfig }) => {
  const [formData, setFormData] = useState<BrokerConfig>(config);
  const [showPassword, setShowPassword] = useState(false);
  const [showMqttPass, setShowMqttPass] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'port' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
  };

  return (
    <div className="bg-immersive-card border border-[#1e293b] rounded-xl overflow-hidden glow-border-custom flex flex-col w-full">
      <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
        <div className="bg-immersive-header px-5 py-4 border-b border-[#1e293b] flex items-center space-x-2 flex-shrink-0">
          <Settings className="h-4 w-4 text-lime-brand" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-white">Broker & Hardware Settings</h2>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Broker Settings Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-1.5 pb-2 border-b border-[#1e293b]">
                <Settings className="h-3.5 w-3.5 text-lime-brand" />
                <span className="text-[10px] font-mono font-bold text-lime-brand uppercase tracking-widest">MQTT Broker Parameters</span>
              </div>
              
              <div>
                <label htmlFor="input-server" className="block text-[10px] font-mono font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">MQTT Server/Host</label>
                <input
                  id="input-server"
                  type="text"
                  name="server"
                  className="w-full bg-[#121924] border border-[#1e293b] rounded text-xs px-3 py-2 text-white placeholder-zinc-600 focus:border-lime-brand focus:outline-none transition-colors select-text"
                  value={formData.server}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-port" className="block text-[10px] font-mono font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Port (SSL 8883)</label>
                  <input
                    id="input-port"
                    type="number"
                    name="port"
                    className="w-full bg-[#121924] border border-[#1e293b] rounded text-xs px-3 py-2 text-white placeholder-zinc-600 focus:border-lime-brand focus:outline-none transition-colors select-text"
                    value={formData.port}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="input-clientId" className="block text-[10px] font-mono font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Web Client ID</label>
                  <input
                    id="input-clientId"
                    type="text"
                    name="clientId"
                    className="w-full bg-[#121924] border border-[#1e293b] rounded text-xs px-3 py-2 text-white placeholder-zinc-600 focus:border-lime-brand focus:outline-none transition-colors select-text"
                    value={formData.clientId}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-user" className="block text-[10px] font-mono font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">MQTT Username</label>
                  <input
                    id="input-user"
                    type="text"
                    name="user"
                    className="w-full bg-[#121924] border border-[#1e293b] rounded text-xs px-3 py-2 text-white placeholder-zinc-600 focus:border-lime-brand focus:outline-none transition-colors select-text"
                    value={formData.user}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="input-pass" className="block text-[10px] font-mono font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">MQTT Password</label>
                  <div className="relative">
                    <input
                      id="input-pass"
                      type={showMqttPass ? "text" : "password"}
                      name="pass"
                      className="w-full bg-[#121924] border border-[#1e293b] rounded pl-3 pr-10 py-2 text-xs text-white placeholder-zinc-600 focus:border-lime-brand focus:outline-none transition-colors select-text"
                      value={formData.pass}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowMqttPass(!showMqttPass)}
                      className="absolute right-2 top-2.5 text-zinc-500 hover:text-white cursor-pointer"
                      title={showMqttPass ? "Sembunyikan sandi" : "Tampilkan sandi"}
                    >
                      {showMqttPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-zinc-500" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Hardware Settings Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-1.5 pb-2 border-b border-[#1e293b]">
                <Wifi className="h-4 w-4 text-lime-brand" />
                <span className="text-[10px] font-mono font-bold text-lime-brand uppercase tracking-widest">ESP8266 Hardware Wi-Fi</span>
              </div>

              <div>
                <label htmlFor="input-ssid" className="block text-[10px] font-mono font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Wi-Fi SSID</label>
                <input
                  id="input-ssid"
                  type="text"
                  name="ssid"
                  className="w-full bg-[#121924] border border-[#1e293b] rounded text-xs px-3 py-2 text-white placeholder-zinc-600 focus:border-lime-brand focus:outline-none transition-colors select-text"
                  value={formData.ssid}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="input-password" className="block text-[10px] font-mono font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Wi-Fi Password</label>
                <div className="relative">
                  <input
                    id="input-password"
                    type={showPassword ? "text" : "password"}
                    name="passwordHash"
                    className="w-full bg-[#121924] border border-[#1e293b] rounded pl-3 pr-10 py-2 text-xs text-white placeholder-zinc-600 focus:border-lime-brand focus:outline-none transition-colors select-text"
                    value={formData.passwordHash || ''}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2.5 text-zinc-500 hover:text-white cursor-pointer"
                    title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-zinc-500" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-[#1e293b] bg-[#0c1420]/50 flex-shrink-0">
          <button
            id="btn-save-settings"
            type="submit"
            className="w-full bg-lime-brand/10 border border-lime-brand/30 hover:bg-lime-brand/20 text-lime-brand rounded py-2.5 font-mono font-bold text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 cursor-pointer transition-all focus:outline-none"
          >
            <Save className="h-4 w-4" />
            <span>Simpan & Terapkan Konfigurasi</span>
          </button>
        </div>
      </form>
    </div>
  );
};
