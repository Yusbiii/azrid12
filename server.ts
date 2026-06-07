/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mqtt from "mqtt";

// Initial configuration states
let brokerConfig = {
  server: "node02.myqtthub.com",
  port: 8883,
  clientId: "web_client_relay_lamp", // Avoid duplicating "esp_client" so they don't conflict
  user: "esp8266",
  pass: "ar12345",
  ssid: "Wanspt04",
  passwordHash: "wanku12345678910",
  selectedBrokerId: "myqtthub"
};

let relays = [
  { id: 1, name: "Relay Lampu 1", state: false, topic: "esp8266/relay1", payloadOn: "1", payloadOff: "0" },
  { id: 2, name: "Relay Lampu 2", state: false, topic: "esp8266/relay2", payloadOn: "1", payloadOff: "0" },
  { id: 3, name: "Relay Lampu 3", state: false, topic: "esp8266/relay3", payloadOn: "1", payloadOff: "0" },
  { id: 4, name: "Relay Lampu 4", state: false, topic: "esp8266/relay4", payloadOn: "1", payloadOff: "0" },
];

let activityLogs: Array<{ id: string; timestamp: string; message: string; type: 'info' | 'success' | 'error' | 'voice' }> = [
  {
    id: "init",
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    message: "Web status: Berhasil dimuat. Broker siap dihubungkan.",
    type: "info"
  }
];

// List of connected SSE clients
let sseClients: any[] = [];

// MQTT Client state
let mqttClient: mqtt.MqttClient | null = null;
let connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

// Sensor State Telemetry
let temperature = 27.4;
let humidity = 62.5;

// Gentle simulation loop to fluctuate sensor values every 5 seconds if not connected or to keep updates live
setInterval(() => {
  const tempDiff = (Math.random() - 0.5) * 0.4;
  const humiDiff = (Math.random() - 0.5) * 0.6;
  temperature = Math.round((Math.max(18, Math.min(45, temperature + tempDiff))) * 10) / 10;
  humidity = Math.round((Math.max(25, Math.min(98, humidity + humiDiff))) * 10) / 10;
  broadcast('sensors', { temperature, humidity });
}, 5000);

const broadcast = (event: string, data: any) => {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  const formattedMsg = `event: ${event}\ndata: ${payload}\n\n`;
  sseClients.forEach((res) => {
    try {
      res.write(formattedMsg);
    } catch (e) {
      // client stale
    }
  });
};

const addLog = (message: string, type: 'info' | 'success' | 'error' | 'voice' = 'info') => {
  const log = {
    id: Math.random().toString(36).substring(7),
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    message,
    type
  };
  activityLogs.unshift(log);
  if (activityLogs.length > 50) {
    activityLogs.pop();
  }
  broadcast('log', log);
};

const disconnectMqtt = () => {
  if (mqttClient) {
    mqttClient.end();
    mqttClient = null;
    connectionStatus = 'disconnected';
    addLog('Koneksi TERPUTUS: Sambungan ke broker diputuskan oleh pengguna.', 'info');
    broadcast('status', connectionStatus);
  }
};

const connectMqtt = () => {
  disconnectMqtt();
  
  connectionStatus = 'connecting';
  broadcast('status', connectionStatus);
  addLog(`Menghubungkan ke broker MyQTTHub (${brokerConfig.server}:${brokerConfig.port})...`, 'info');
  
  const protocol = brokerConfig.port === 8883 ? 'mqtts' : 'mqtt';
  const brokerUrl = `${protocol}://${brokerConfig.server}:${brokerConfig.port}`;
  
  try {
    mqttClient = mqtt.connect(brokerUrl, {
      clientId: brokerConfig.clientId,
      username: brokerConfig.user,
      password: brokerConfig.pass,
      rejectUnauthorized: false, // ignore self-signed certificate errors to increase compatibility
      connectTimeout: 8000,
      reconnectPeriod: 4000,
    });
    
    mqttClient.on('connect', () => {
      connectionStatus = 'connected';
      addLog(`Koneksi BERHASIL: Web terhubung ke Broker MyQTTHub di ${brokerConfig.server}`, 'success');
      broadcast('status', connectionStatus);
      
      // Resubscribe to our topics so any external trigger changes sync back here
      relays.forEach(relay => {
        mqttClient?.subscribe(relay.topic, (err) => {
          if (err) {
            console.error(`Gagal melakukan subscribe ke ${relay.topic}`);
          }
        });
      });

      // Subscribe to temperature and humidity sensors
      mqttClient?.subscribe("esp8266/temperature", (err) => {
        if (err) console.error("Gagal subscribe ke topik suhu");
      });
      mqttClient?.subscribe("esp8266/humidity", (err) => {
        if (err) console.error("Gagal subscribe ke topik kelembapan");
      });
    });
    
    mqttClient.on('message', (topic, message) => {
      const msgStr = message.toString();
      
      if (topic === "esp8266/temperature") {
        const val = parseFloat(msgStr);
        if (!isNaN(val)) {
          temperature = val;
          addLog(`Sensor Telemetri: Suhu diperbarui ke ${temperature}°C`, 'info');
          broadcast('sensors', { temperature, humidity });
        }
        return;
      }
      
      if (topic === "esp8266/humidity") {
        const val = parseFloat(msgStr);
        if (!isNaN(val)) {
          humidity = val;
          addLog(`Sensor Telemetri: Kelembapan diperbarui ke ${humidity}%`, 'info');
          broadcast('sensors', { temperature, humidity });
        }
        return;
      }

      let stateChanged = false;
      
      relays = relays.map(relay => {
        if (relay.topic === topic) {
          const isOn = msgStr === relay.payloadOn;
          if (relay.state !== isOn) {
            stateChanged = true;
            addLog(`Sinkronasi MQTT: Status ${relay.name} diubah ke ${isOn ? 'ON' : 'OFF'}`, 'info');
            return { ...relay, state: isOn };
          }
        }
        return relay;
      });
      
      if (stateChanged) {
        broadcast('relays', relays);
      }
    });
    
    mqttClient.on('error', (err) => {
      addLog(`Kesalahan Koneksi Broker: ${err.message}`, 'error');
      connectionStatus = 'error';
      broadcast('status', connectionStatus);
    });
    
    mqttClient.on('close', () => {
      if (connectionStatus === 'connected') {
        connectionStatus = 'disconnected';
        addLog(`Koneksi Terputus: Jaringan atau Broker menutup sambungan.`, 'error');
        broadcast('status', connectionStatus);
      }
    });

  } catch (error: any) {
    connectionStatus = 'error';
    addLog(`Error menginisialisasi MQTT: ${error.message}`, 'error');
    broadcast('status', connectionStatus);
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Get State
  app.get("/api/mqtt/state", (req, res) => {
    res.json({
      status: connectionStatus,
      config: brokerConfig,
      relays: relays,
      logs: activityLogs,
      sensors: { temperature, humidity }
    });
  });

  // API Route: Update Configuration & Reconnect
  app.post("/api/mqtt/config", (req, res) => {
    const { server, port, clientId, user, pass, ssid, passwordHash, selectedBrokerId } = req.body;
    
    brokerConfig = {
      ...brokerConfig,
      server: server || brokerConfig.server,
      port: Number(port) || brokerConfig.port,
      clientId: clientId || brokerConfig.clientId,
      user: user || brokerConfig.user,
      pass: pass || brokerConfig.pass,
      ssid: ssid || brokerConfig.ssid,
      passwordHash: passwordHash || brokerConfig.passwordHash,
      selectedBrokerId: selectedBrokerId || brokerConfig.selectedBrokerId
    };

    addLog(`Konfigurasi broker diperbarui.`, 'info');
    
    // Automatically reconnect with new settings if we were active
    if (connectionStatus === 'connected' || connectionStatus === 'connecting' || connectionStatus === 'error') {
      connectMqtt();
    }
    
    res.json({ success: true, config: brokerConfig });
  });

  // API Route: Connect Broker
  app.post("/api/mqtt/connect", (req, res) => {
    connectMqtt();
    res.json({ success: true, status: connectionStatus });
  });

  // API Route: Disconnect Broker
  app.post("/api/mqtt/disconnect", (req, res) => {
    disconnectMqtt();
    res.json({ success: true, status: connectionStatus });
  });

  // API Route: Control Relay
  app.post("/api/mqtt/relay", (req, res) => {
    const { id, state } = req.body;
    const targetIdx = relays.findIndex(r => r.id === id);
    if (targetIdx === -1) {
      return res.status(404).json({ error: "Relay tidak ditemukan." });
    }

    const relay = relays[targetIdx];
    relay.state = state;
    
    const payload = state ? relay.payloadOn : relay.payloadOff;
    const stateStr = state ? "ON" : "OFF";
    
    addLog(`Tombol ditekan: mengubah ${relay.name} menjadi ${stateStr}`, 'info');

    // Publish to MQTT if connected
    if (mqttClient && connectionStatus === 'connected') {
      try {
        mqttClient.publish(relay.topic, payload, { qos: 1, retain: true });
        addLog(`Berhasil mengirim ke MQTT: ${relay.name} -> ${stateStr} (Topik: ${relay.topic}, Payload: ${payload})`, 'success');
      } catch (err: any) {
        addLog(`Gagal mempublikasikan ke MQTT: ${err.message}`, 'error');
      }
    } else {
      addLog(`Perhatian: Tidak dapat mengirim ke broker. Status web saat ini sedang terputus. (Lokal state diperbarui)`, 'error');
    }

    broadcast('relays', relays);
    res.json({ success: true, relays: relays });
  });

  // API Route: Log voice commands or external actions directly
  app.post("/api/mqtt/log", (req, res) => {
    const { message, type } = req.body;
    addLog(message, type || 'info');
    res.json({ success: true });
  });

  // API Route: Match/Sync and set sensors programmatically
  app.post("/api/mqtt/sensors", (req, res) => {
    const { temp, humi } = req.body;
    let updated = false;
    
    if (temp !== undefined && !isNaN(Number(temp))) {
      temperature = Number(temp);
      updated = true;
    }
    if (humi !== undefined && !isNaN(Number(humi))) {
      humidity = Number(humi);
      updated = true;
    }
    
    if (updated) {
      addLog(`Sinkronisasi Sensor: Penyesuaian ke Suhu: ${temperature}°C, Kelembapan: ${humidity}%`, 'info');
      broadcast('sensors', { temperature, humidity });
      
      // If connected to MQTT, publish updated status to ESP8266 topics to synchronize
      if (mqttClient && connectionStatus === 'connected') {
        try {
          if (temp !== undefined) {
            mqttClient.publish("esp8266/temperature", temperature.toString(), { qos: 1, retain: true });
          }
          if (humi !== undefined) {
            mqttClient.publish("esp8266/humidity", humidity.toString(), { qos: 1, retain: true });
          }
        } catch (err: any) {
          console.error("Gagal sinkronisasi sensor ke MQTT:", err.message);
        }
      }
    }
    
    res.json({ success: true, temperature, humidity });
  });

  // SSE (Server-Sent Events) Endpoint for real-time streaming
  app.get("/api/mqtt/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Establish the SSE connection immediately

    sseClients.push(res);
    
    // Send initial status payload
    res.write(`event: status\ndata: ${connectionStatus}\n\n`);
    res.write(`event: relays\ndata: ${JSON.stringify(relays)}\n\n`);
    res.write(`event: sensors\ndata: ${JSON.stringify({ temperature, humidity })}\n\n`);

    req.on("close", () => {
      sseClients = sseClients.filter(c => c !== res);
    });
  });

  // Vite development / production static server handling
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
