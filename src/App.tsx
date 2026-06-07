/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { BrokerConfig, RelayConfig, LogEntry, ButtonStyleVariation } from './types';
import { Navbar } from './components/Navbar';
import { RelayControl } from './components/RelayControl';
import { VoiceCommand } from './components/VoiceCommand';
import { ActivityLog } from './components/ActivityLog';
import { SettingsPanel } from './components/SettingsPanel';
import { SensorPanel } from './components/SensorPanel';
import { LayoutGrid, Cpu, Smartphone, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  const [mqttStatus, setMqttStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [brokerConfig, setBrokerConfig] = useState<BrokerConfig>({
    server: "node02.myqtthub.com",
    port: 8883,
    clientId: "web_client_relay_lamp",
    user: "esp8266",
    pass: "ar12345",
    ssid: "Wanspt04",
    passwordHash: "wanku12345678910",
    selectedBrokerId: "myqtthub"
  });

  const [relays, setRelays] = useState<RelayConfig[]>([
    { id: 1, name: "Relay Lampu 1", state: false, topic: "esp8266/relay1", payloadOn: "1", payloadOff: "0" },
    { id: 2, name: "Relay Lampu 2", state: false, topic: "esp8266/relay2", payloadOn: "1", payloadOff: "0" },
    { id: 3, name: "Relay Lampu 3", state: false, topic: "esp8266/relay3", payloadOn: "1", payloadOff: "0" },
    { id: 4, name: "Relay Lampu 4", state: false, topic: "esp8266/relay4", payloadOn: "1", payloadOff: "0" },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sensors, setSensors] = useState<{ temperature: number; humidity: number }>({ temperature: 27.4, humidity: 62.5 });
  const [styleVariation, setStyleVariation] = useState<ButtonStyleVariation>('cyber-glow' as any); // fallback checked

  // Fetch initial state & listen to SSE updates
  useEffect(() => {
    // 1. Fetch initial configurations & states
    fetch('/api/mqtt/state')
      .then(res => res.json())
      .then(data => {
        setMqttStatus(data.status);
        setRelays(data.relays);
        setBrokerConfig(data.config);
        setLogs(data.logs);
        if (data.sensors) {
          setSensors(data.sensors);
        }
      })
      .catch(err => {
        console.error("Gagal memuat status awal server:", err);
      });

    // 2. Establish server sent events stream
    const eventSource = new EventSource('/api/mqtt/events');

    eventSource.onopen = () => {
      console.log("Koneksi SSE dibuka dengan sukses.");
    };

    eventSource.addEventListener('status', (e: any) => {
      setMqttStatus(e.data);
    });

    eventSource.addEventListener('relays', (e: any) => {
      try {
        const parsedRelays = JSON.parse(e.data);
        setRelays(parsedRelays);
      } catch (err) {
        console.error("Gagal melakukan parse status relay:", err);
      }
    });

    eventSource.addEventListener('log', (e: any) => {
        try {
          const parsedLog = JSON.parse(e.data);
          setLogs(prev => [parsedLog, ...prev]);
        } catch (err) {
          console.error("Gagal memproses event log:", err);
        }
      });

      eventSource.addEventListener('sensors', (e: any) => {
        try {
          const parsedSensors = JSON.parse(e.data);
          setSensors(parsedSensors);
        } catch (err) {
          console.error("Gagal memproses event sensors:", err);
        }
      });

    eventSource.onerror = (err) => {
      console.error("Koneksi SSE terputus:", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Operation 1: Toggle Relay ON / OFF
  const handleToggleRelay = useCallback((id: number, currentState: boolean) => {
    fetch('/api/mqtt/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, state: !currentState })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRelays(data.relays);
        }
      })
      .catch(err => console.error("Gagal merubah status relay:", err));
  }, []);

  // Operation 1b: Set Relay to explicit State (ON / OFF)
  const handleSetRelayState = useCallback((id: number, targetState: boolean) => {
    fetch('/api/mqtt/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, state: targetState })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRelays(data.relays);
        }
      })
      .catch(err => console.error("Gagal menetapkan status relay:", err));
  }, []);

  // Operation 1c: Sync or Set specific sensor updates programmatically
  const handleSetSensors = useCallback((temp?: number, humi?: number) => {
    fetch('/api/mqtt/sensors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temp, humi })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSensors({ temperature: data.temperature, humidity: data.humidity });
        }
      })
      .catch(err => console.error("Gagal menyinkronkan status sensor:", err));
  }, []);

  // Operation 2: Connect to MQTT Broker
  const handleConnectMqtt = useCallback(() => {
    fetch('/api/mqtt/connect', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setMqttStatus(data.status);
      })
      .catch(err => console.error("Gagal mengirim perintah koneksi:", err));
  }, []);

  // Operation 3: Disconnect from MQTT Broker
  const handleDisconnectMqtt = useCallback(() => {
    fetch('/api/mqtt/disconnect', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setMqttStatus(data.status);
      })
      .catch(err => console.error("Gagal mengirim perintah pemutusan:", err));
  }, []);

  // Operation 4: Save & Apply Configuration Changes
  const handleSaveConfig = useCallback((newConfig: BrokerConfig) => {
    fetch('/api/mqtt/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBrokerConfig(data.config);
          // If we are currently connected, we should trigger a soft reconnection log notification
          setMqttStatus('disconnected');
          setTimeout(() => {
            handleConnectMqtt();
          }, 300);
        }
      })
      .catch(err => console.error("Gagal memperbarui konfigurasi broker:", err));
  }, [handleConnectMqtt]);

  // Operation 5: Push custom activity log (e.g. from Speech Recognition)
  const handlePushLog = useCallback((message: string, type?: 'info' | 'success' | 'error' | 'voice') => {
    fetch('/api/mqtt/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, type: type || 'info' })
    })
      .then(res => res.json())
      .catch(err => console.error("Gagal mencatat log kegiatan:", err));
  }, []);

  // Operation 6: Clear visual log panel
  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Clean, literal naming scheme & unified layout structure
  return (
    <div className="min-h-screen bg-immersive-bg text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Header Navigation operations */}
      <Navbar
        status={mqttStatus}
        selectedBrokerId={brokerConfig.selectedBrokerId}
        onConnect={handleConnectMqtt}
        onDisconnect={handleDisconnectMqtt}
        serverUrl={brokerConfig.server}
      />

      {/* Main Container Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Welcome Info Box Dashboard Overview */}
        <div className="bg-immersive-card border border-[#1e293b] rounded-xl p-6 glow-border-custom relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-r from-lime-brand/5 to-transparent pointer-events-none"></div>
          
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-lime-brand tracking-widest">SISTEM INTEGRASI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-lime-brand animate-ping"></span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-lime-brand" />
              <span>Smart IoT Control Cockpit</span>
            </h1>
            <p className="text-xs text-zinc-400">
              Sistem manajemen nirkabel terkompilasi untuk mengendalikan lampu rumah Anda via protokol MQTT & Perintah Suara.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <div className="bg-[#121924] border border-[#1e293b] px-4 py-2.5 rounded flex items-center space-x-3.5">
              <Cpu className="h-4 w-4 text-lime-brand" />
              <div>
                <span className="text-[8px] font-mono block text-zinc-500 uppercase tracking-widest font-black leading-none">WiFi SSID</span>
                <span className="text-xs font-mono font-bold text-white leading-none block mt-1.5">{brokerConfig.ssid}</span>
              </div>
            </div>
            
            <div className="bg-[#121924] border border-[#1e293b] px-4 py-2.5 rounded flex items-center space-x-3.5">
              <Smartphone className="h-4 w-4 text-lime-brand" />
              <div>
                <span className="text-[8px] font-mono block text-zinc-500 uppercase tracking-widest font-black leading-none">MQTT Server</span>
                <span className="text-xs font-mono font-bold text-white leading-none block mt-1.5">{brokerConfig.server}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Sensor Telemetry Widgets */}
        <SensorPanel temperature={sensors.temperature} humidity={sensors.humidity} />

        {/* Primary Controls Grid Layout (Switch Panel + Voice Commands) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column Left: 4 Relay Switches */}
          <div className="lg:col-span-8 flex flex-col h-full justify-between">
            <RelayControl
              relays={relays}
              styleVariation={styleVariation === 'cyber-glow' ? 'neon-cyber' : 'tactile-toggle'}
              setStyleVariation={(varStyle) => setStyleVariation(varStyle === 'neon-cyber' ? 'cyber-glow' : 'tactile-toggle' as any)}
              onToggleRelay={handleToggleRelay}
              mqttStatus={mqttStatus}
            />
          </div>

          {/* Column Right: Voice Command Widget */}
          <div className="lg:col-span-4 h-full">
            <VoiceCommand
              onSetRelayState={handleSetRelayState}
              onSetSensors={handleSetSensors}
              relays={relays}
              onPushLog={handlePushLog}
              temperature={sensors.temperature}
              humidity={sensors.humidity}
            />
          </div>
        </div>

        {/* Console Logs Panel (Monitor activities) */}
        <div className="w-full">
          <ActivityLog
            logs={logs}
            onClearLogs={handleClearLogs}
          />
        </div>

        {/* Hardware & Broker Configurations Form */}
        <div className="w-full">
          <SettingsPanel
            config={brokerConfig}
            onSaveConfig={handleSaveConfig}
          />
        </div>
      </main>

      {/* Humble, Clean Footer */}
      <footer className="border-t border-[#1e293b] bg-immersive-nav py-6 mt-12 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} Smart IoT Relay Controller. All active states synchronized.</span>
          <span className="flex items-center space-x-2 uppercase font-black tracking-wider text-[9px] text-lime-brand bg-lime-brand/10 px-3.5 py-1.5 rounded border border-lime-brand/20">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-brand animate-pulse"></span>
            <span>Aksentuasi #7FFF00</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
