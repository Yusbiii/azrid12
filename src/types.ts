/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BrokerConfig {
  server: string;
  port: number;
  clientId: string;
  user: string;
  pass: string;
  ssid: string;
  passwordHash: string; // WiFi password
  selectedBrokerId: string;
}

export interface RelayConfig {
  id: number;
  name: string;
  state: boolean;
  topic: string;
  payloadOn: string;
  payloadOff: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'voice';
}

export type ButtonStyleVariation = 'neon-cyber' | 'tactile-toggle';
