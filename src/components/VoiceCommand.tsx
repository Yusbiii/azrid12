/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Info, Check, HelpCircle, Send, Volume2, VolumeX } from 'lucide-react';

interface VoiceCommandProps {
  onSetRelayState: (id: number, state: boolean) => void;
  onSetSensors: (temp?: number, humi?: number) => void;
  relays: Array<{ id: number; name: string; state: boolean }>;
  onPushLog: (message: string, type?: 'info' | 'success' | 'error' | 'voice') => void;
  temperature?: number;
  humidity?: number;
}

export const VoiceCommand: React.FC<VoiceCommandProps> = ({
  onSetRelayState,
  onSetSensors,
  relays,
  onPushLog,
  temperature,
  humidity,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [simulatedCommand, setSimulatedCommand] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Helper function to play synthesized cool, high-tech audio chimes
  const playCoolChime = (type: 'success' | 'error' | 'listen') => {
    if (!voiceFeedbackEnabled) return;
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'success') {
        // Futuristic double-tone rising chime (glowing success trigger)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        // Frequency sweeps from warm mids to shimmering crystalline highs
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // C6

        osc2.frequency.setValueAtTime(783.99, now); // G5
        osc2.frequency.exponentialRampToValueAtTime(1567.98, now + 0.15); // G6

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.25);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);

      } else if (type === 'error') {
        // Robotic error dual frequencies descending blip
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(329.63, now); // E4
        osc.frequency.linearRampToValueAtTime(220.00, now + 0.08); // A3

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);

      } else if (type === 'listen') {
        // Instant sharp double blip to signal wakefulness
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (e) {
      console.error('Context audio error:', e);
    }
  };

  // Helper function to synthesize Indonesian speech response using the native Web Speech API
  const speakFeedback = (text: string, isError: boolean = false) => {
    if (!voiceFeedbackEnabled) return;
    
    // Play corresponding futuristic audio chime context first
    playCoolChime(isError ? 'error' : 'success');

    if ('speechSynthesis' in window) {
      try {
        // Cancel any active speech synthesis
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        
        // Find Indonesian voice if possible
        const voices = window.speechSynthesis.getVoices();
        const indonesianVoice = voices.find(voice => voice.lang.startsWith('id') || voice.lang.includes('id-ID'));
        if (indonesianVoice) {
          utterance.voice = indonesianVoice;
        }
        
        utterance.rate = 1.05; // Slightly faster for high-tech premium response style
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Text-to-Speech synthesis failed:', err);
      }
    }
  };

  // Pre-load voices for Indonesian compatibility
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Initialize Speech Recognition on Mount (if supported)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'id-ID'; // Set language to Indonesian
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage('');
        setSpeechText('Mendengarkan...');
        onPushLog('Mendengarkan suara... silakan ucapkan perintah Anda (misal: "nyalakan lampu 1").', 'voice');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpeechText(transcript);
        onPushLog(`Mendengar suara: "${transcript}"`, 'voice');
        processSpeechCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        let friendlyErr = event.error;
        if (event.error === 'not-allowed') {
          friendlyErr = 'Izin mikrofon ditolak/diblokir oleh browser/iframe.';
        } else if (event.error === 'no-speech') {
          friendlyErr = 'Tidak ada suara yang terdeteksi.';
        }
        setErrorMessage(friendlyErr);
        onPushLog(`Gagal mendengarkan suara: ${friendlyErr}`, 'error');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setErrorMessage('Browser ini tidak mendukung Web Speech API (Gunakan simulasi di bawah).');
    }
  }, [onPushLog]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        // Play futuristic wake/beep chime on user click gesture
        playCoolChime('listen');
        try {
          recognitionRef.current.start();
        } catch (e: any) {
          recognitionRef.current.stop();
          // Retry after a small delay
          setTimeout(() => {
            recognitionRef.current.start();
          }, 300);
        }
      } else {
        onPushLog('Gagal memulai: SpeechRecognition tidak didukung oleh browser Anda.', 'error');
      }
    }
  };

  // Centralised Command Processor with highly robust matching rules & Text-to-Speech confirmations
  const processSpeechCommand = (text: string) => {
    const lowerText = text.toLowerCase().trim();
    
    // 0. Global sensor synchronization command
    // E.g. "sinkronkan sensor", "singkronkan suhu dan kelembapan", "sesuaikan suhu dan kelembaban" etc.
    if ((lowerText.includes('sinkron') || lowerText.includes('singkron') || lowerText.includes('sync') || lowerText.includes('saling')) &&
        (lowerText.includes('sensor') || (lowerText.includes('suhu') && (lowerText.includes('kelembaban') || lowerText.includes('kelembapan') || lowerText.includes('lembab'))))) {
      const defaultSyncTemp = 25.5;
      const defaultSyncHumi = 60.0;
      onSetSensors(defaultSyncTemp, defaultSyncHumi);
      const speakMsg = `Baik, sinkronisasi penuh diaktifkan. Suhu ruangan disesuaikan ke ${defaultSyncTemp} derajat, kelembapan ${defaultSyncHumi} persen.`;
      onPushLog(`Voice Command Sukses: Sinkronisasi penuh sensor terkomit -> Temp: ${defaultSyncTemp}°C, Humi: ${defaultSyncHumi}%`, 'success');
      speakFeedback(speakMsg);
      return;
    }

    // 0b. Checker for Temperature adjustments, queries, or syncs
    if (lowerText.includes('suhu') || lowerText.includes('temperatur') || lowerText.includes('temp')) {
      // Check for setting command e.g. "sesuaikan suhu ke...", "atur suhu jadi...", "ubah suhu ..."
      const isSetCommand = lowerText.includes('atur') || lowerText.includes('setel') || lowerText.includes('ubah') || lowerText.includes('sesuaikan') || lowerText.includes('suku') || lowerText.includes('suhu ke') || lowerText.includes('suhu jadi');
      
      if (isSetCommand) {
        const numbers = lowerText.match(/\d+([.,]\d+)?/);
        if (numbers) {
          const matchedVal = parseFloat(numbers[0].replace(',', '.'));
          if (!isNaN(matchedVal) && matchedVal >= 0 && matchedVal <= 60) {
            onSetSensors(matchedVal, undefined);
            const speakMsg = `Baik, suhu ruangan disesuaikan ke ${matchedVal} derajat Celcius.`;
            onPushLog(`Voice Command Sukses: Menyesuaikan suhu -> ${matchedVal}°C`, 'success');
            speakFeedback(speakMsg);
            return;
          }
        }
      }
      
      // Check for individual sync request: "sinkronkan suhu", "singkronkan temperatur"
      const isSyncCommand = lowerText.includes('sinkron') || lowerText.includes('singkron') || lowerText.includes('sync') || lowerText.includes('saling');
      if (isSyncCommand) {
        const defaultSyncTemp = 24.0;
        onSetSensors(defaultSyncTemp, undefined);
        const speakMsg = `Baik, melakukan sinkronisasi suhu saat ini ke ${defaultSyncTemp} derajat Celcius.`;
        onPushLog(`Voice Command Sukses: Sinkronisasi suhu ke ${defaultSyncTemp}°C secara real-time.`, 'success');
        speakFeedback(speakMsg);
        return;
      }

      // Default to Query
      const tempVal = temperature !== undefined ? `Suhu telemetri saat ini adalah ${temperature.toFixed(1)} derajat Celcius` : 'Suhu sensor belum termonitor saat ini';
      onPushLog(`Voice Command Sukses: Mendeteksi kueri suhu -> ${temperature !== undefined ? temperature.toFixed(1) + '°C' : 'N/A'}`, 'success');
      onPushLog(`[Asisten Suara]: "${tempVal}"`, 'info');
      speakFeedback(tempVal);
      return;
    }

    // 0c. Checker for Humidity adjustments, queries, or syncs
    if (
      lowerText.includes('kelembapan') ||
      lowerText.includes('kelembaban') ||
      lowerText.includes('lembab') ||
      lowerText.includes('humidity')
    ) {
      // Check for setting command: "sesuaikan kelembaban ke...", "atur kelembapan jadi..."
      const isSetCommand = lowerText.includes('atur') || lowerText.includes('setel') || lowerText.includes('ubah') || lowerText.includes('sesuaikan') || lowerText.includes('kelembaban ke') || lowerText.includes('kelembapan ke') || lowerText.includes('kelembapan jadi') || lowerText.includes('kelembaban jadi');
      
      if (isSetCommand) {
        const numbers = lowerText.match(/\d+([.,]\d+)?/);
        if (numbers) {
          const matchedVal = parseFloat(numbers[0].replace(',', '.'));
          if (!isNaN(matchedVal) && matchedVal >= 0 && matchedVal <= 100) {
            onSetSensors(undefined, matchedVal);
            const speakMsg = `Baik, kelembapan udara disesuaikan ke ${matchedVal} persen.`;
            onPushLog(`Voice Command Sukses: Menyesuaikan kelembapan -> ${matchedVal}%`, 'success');
            speakFeedback(speakMsg);
            return;
          }
        }
      }
      
      // Check for individual sync request: "sinkronkan kelembaban"
      const isSyncCommand = lowerText.includes('sinkron') || lowerText.includes('singkron') || lowerText.includes('sync') || lowerText.includes('saling');
      if (isSyncCommand) {
        const defaultSyncHumi = 60.5;
        onSetSensors(undefined, defaultSyncHumi);
        const speakMsg = `Baik, melakukan sinkronisasi kelembapan saat ini ke ${defaultSyncHumi} persen.`;
        onPushLog(`Voice Command Sukses: Sinkronisasi kelembapan ke ${defaultSyncHumi}% secara real-time.`, 'success');
        speakFeedback(speakMsg);
        return;
      }

      // Default to Query
      const humiVal = humidity !== undefined ? `Kelembapan udara saat ini adalah ${humidity.toFixed(1)} persen` : 'Kelembapan sensor belum termonitor saat ini';
      onPushLog(`Voice Command Sukses: Mendeteksi kueri kelembapan -> ${humidity !== undefined ? humidity.toFixed(1) + '%' : 'N/A'}`, 'success');
      onPushLog(`[Asisten Suara]: "${humiVal}"`, 'info');
      speakFeedback(humiVal);
      return;
    }

    // 1. Determine Target Action State (ON/OFF)
    let stateToApply: boolean | null = null;

    // Check OFF actions first to prevent false matching (e.g. "nonaktifkan" containing "aktif")
    if (
      lowerText.includes('mati') ||
      lowerText.includes('padam') ||
      lowerText.includes('non-aktif') ||
      lowerText.includes('nonaktif') ||
      lowerText.includes('off') ||
      lowerText.includes('tutup')
    ) {
      stateToApply = false;
    } else if (
      lowerText.includes('nyala') ||
      lowerText.includes('hidup') ||
      lowerText.includes('aktif') ||
      lowerText.includes('on') ||
      lowerText.includes('buka')
    ) {
      stateToApply = true;
    }

    if (stateToApply === null) {
      onPushLog(`Perintah suara tidak dikenali: "${text}". Silakan gunakan kata kerja seperti "nyalakan", "matikan", "hidupkan", atau "padamkan".`, 'error');
      speakFeedback("Maaf, perintah suara tidak dikenali.", true);
      return;
    }

    const stateStr = stateToApply ? 'ON' : 'OFF';

    // 2. Determine Target Relay Identifier
    // Check for global action first ("semua" / "seluruh" / "all")
    if (lowerText.includes('semua') || lowerText.includes('all') || lowerText.includes('seluruh')) {
      const speakMsg = `Baik, saya akan ${stateToApply ? 'menyalakan' : 'mematikan'} semua lampu.`;
      onPushLog(`Voice Command Sukses: Mengubah SEMUA Lampu menjadi ${stateStr}`, 'success');
      speakFeedback(speakMsg);
      relays.forEach((relay) => {
        onSetRelayState(relay.id, stateToApply!);
      });
      return;
    }

    let matchedRelayId: number | null = null;

    if (lowerText.includes('1') || lowerText.includes('satu') || lowerText.includes('one')) {
      matchedRelayId = 1;
    } else if (lowerText.includes('2') || lowerText.includes('dua') || lowerText.includes('two')) {
      matchedRelayId = 2;
    } else if (lowerText.includes('3') || lowerText.includes('tiga') || lowerText.includes('three')) {
      matchedRelayId = 3;
    } else if (lowerText.includes('4') || lowerText.includes('empat') || lowerText.includes('four')) {
      matchedRelayId = 4;
    }

    if (matchedRelayId !== null) {
      const targetRelay = relays.find(r => r.id === matchedRelayId);
      if (targetRelay) {
        const speakMsg = `Baik, ${stateToApply ? 'menyalakan' : 'mematikan'} ${targetRelay.name}.`;
        onPushLog(`Voice Command Sukses: Mengaktifkan ${targetRelay.name} -> ${stateStr}`, 'success');
        speakFeedback(speakMsg);
        onSetRelayState(matchedRelayId, stateToApply);
      } else {
        const errMsg = `Relay dengan ID ${matchedRelayId} tidak ditemukan.`;
        onPushLog(`Voice Command Gagal: ${errMsg}`, 'error');
        speakFeedback(`Maaf, ${errMsg}`, true);
      }
    } else {
      // Fallback: If no number matched, try mapping by name matching if user specified it
      let foundByName = false;
      for (const relay of relays) {
        const normalizedRelayName = relay.name.toLowerCase();
        // check e.g. "lampu satu" vs "lampu 1"
        if (lowerText.includes(normalizedRelayName) || lowerText.includes(`lampu ${relay.id}`)) {
          const speakMsg = `Baik, ${stateToApply ? 'menyalakan' : 'mematikan'} ${relay.name}.`;
          onPushLog(`Voice Command Sukses: Mengubah ${relay.name} -> ${stateStr}`, 'success');
          speakFeedback(speakMsg);
          onSetRelayState(relay.id, stateToApply);
          foundByName = true;
          break;
        }
      }

      if (!foundByName) {
        onPushLog(`Voice Command Gagal: Tidak dapat mencocokkan nomor relay atau kata "semua" dalam ucapan "${text}".`, 'error');
        speakFeedback("Maaf, nomor lampu tidak terdeteksi.", true);
      }
    }
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedCommand.trim()) return;

    onPushLog(`Simulasi Perintah Suara dikirim: "${simulatedCommand}"`, 'voice');
    processSpeechCommand(simulatedCommand);
    setSpeechText(simulatedCommand);
    setSimulatedCommand('');
  };

  return (
    <div className="bg-immersive-card border border-[#1e293b] rounded-xl relative overflow-hidden glow-border-custom flex flex-col justify-between h-full">
      {/* Decorative subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.1] pointer-events-none"></div>

      <div>
        {/* Accent Header */}
        <div className="bg-immersive-header px-5 py-4 border-b border-[#1e293b] flex justify-between items-center relative z-10 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-lime-brand tracking-widest">ASISTEN SUARA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            </div>
            <h2 className="text-base font-bold text-white mt-1 leading-none">Voice Command</h2>
          </div>

          {/* Voice feedback toggle button */}
          <button
            onClick={() => setVoiceFeedbackEnabled(!voiceFeedbackEnabled)}
            className={`p-2 rounded-lg border cursor-pointer transition-all ${
              voiceFeedbackEnabled
                ? 'bg-lime-brand/10 text-lime-brand border-lime-brand/20 hover:bg-lime-brand/20'
                : 'bg-zinc-800/40 text-zinc-500 border-zinc-800 hover:text-zinc-300'
            }`}
            title={voiceFeedbackEnabled ? "Matikan Suara Konfirmasi (Mute)" : "Aktifkan Suara Konfirmasi"}
          >
            {voiceFeedbackEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>

        <div className="p-5 flex flex-col items-center">
          {/* Circular Ambient Pulse Mic Button */}
          <div className="flex flex-col items-center justify-center my-6 relative z-10">
            <div className="relative flex items-center justify-center">
              {/* Pulsing visual circles */}
              {isListening && (
                <>
                  <div className="absolute w-36 h-36 rounded-full border border-lime-brand/20 bg-lime-brand/5 animate-ping opacity-60"></div>
                  <div className="absolute w-28 h-28 rounded-full border border-lime-brand/30 bg-lime-brand/10 animate-pulse"></div>
                </>
              )}
              
              <button
                onClick={toggleListening}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center border transition-all duration-300 cursor-pointer ${
                  isListening
                    ? 'bg-lime-brand text-black border-lime-brand shadow-[0_0_25px_rgba(127,255,0,0.4)]'
                    : 'bg-[#1a2230] text-zinc-400 hover:text-white border-[#1e293b] hover:border-lime-brand hover:bg-[#1f2a3d]'
                }`}
                title={isListening ? "Klik untuk menghentikan pendengaran" : "Klik untuk merekam perintah suara"}
              >
                {isListening ? (
                  <Mic className="h-8 w-8 text-black animate-bounce" />
                ) : (
                  <MicOff className="h-8 w-8" />
                )}
              </button>
            </div>
            
            {/* Ambient sound-wave visualization effect */}
            {isListening && (
              <div className="mt-4 flex gap-1 justify-center items-center h-8">
                <span className="w-1 h-3 bg-lime-brand opacity-30 rounded-full animate-pulse"></span>
                <span className="w-1 h-5 bg-lime-brand opacity-60 rounded-full animate-pulse delay-75"></span>
                <span className="w-1 h-3 bg-lime-brand opacity-80 rounded-full animate-pulse delay-100"></span>
                <span className="w-1 h-7 bg-lime-brand rounded-full animate-pulse delay-150"></span>
                <span className="w-1 h-3 bg-lime-brand opacity-80 rounded-full animate-pulse delay-200"></span>
                <span className="w-1 h-5 bg-lime-brand opacity-60 rounded-full animate-pulse delay-300"></span>
                <span className="w-1 h-3 bg-lime-brand opacity-20 rounded-full animate-pulse delay-500"></span>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${isListening ? 'text-lime-brand animate-pulse' : 'text-zinc-500'}`}>
                {isListening ? "Mendengar Suara..." : "SIAP MEREKAM"}
              </span>
              {speechText && (
                <p className="text-xs italic bg-[#101726]/90 border border-[#1e293b] rounded px-3 py-1.5 mt-2 max-w-[200px] text-zinc-300 mx-auto">
                  "{speechText}"
                </p>
              )}
              {errorMessage && (
                <p className="text-[10px] text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1 mt-2.5">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>

          {/* Predefined Voice Phrase Help */}
          <div className="w-full bg-[#101726]/60 border border-[#1e293b] rounded-lg p-3.5 mt-2">
            <span className="text-[10px] font-mono font-bold text-lime-brand flex items-center gap-1 uppercase tracking-wider mb-2">
              <HelpCircle className="h-3.5 w-3.5 text-lime-brand" /> Pola Ucapan yang Didukung:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-400">
              <div className="bg-[#0a0f18]/60 p-1.5 rounded border border-[#1e293b]/50">
                <span className="text-white">LAMPU ON:</span> "Nyalakan lampu 1"
              </div>
              <div className="bg-[#0a0f18]/60 p-1.5 rounded border border-[#1e293b]/50">
                <span className="text-white">LAMPU OFF:</span> "Matikan lampu 2"
              </div>
              <div className="bg-[#0a0f18]/60 p-1.5 rounded border border-[#1e293b]/50">
                <span className="text-white">SEMUA:</span> "Matikan semua"
              </div>
              <div className="bg-[#0a0f18]/60 p-1.5 rounded border border-[#1e293b]/50">
                <span className="text-white">TANYA SUHU:</span> "Berapa suhu sekarang?"
              </div>
              <div className="bg-[#0a0f18]/60 p-1.5 rounded border border-[#1e293b]/50">
                <span className="text-white">ATUR SUHU:</span> "Ubah suhu ke 26"
              </div>
              <div className="bg-[#0a0f18]/60 p-1.5 rounded border border-[#1e293b]/50">
                <span className="text-white">ATUR LEMBAB:</span> "Atur kelembapan ke 60"
              </div>
              <div className="bg-[#0a0f18]/60 p-1.5 rounded border border-[#1e293b]/50 col-span-2 text-center text-lime-brand bg-lime-brand/5 border-lime-brand/10">
                <span className="text-white">SINKRONISASI:</span> "Sinkronkan sensor" atau "Sinkronkan suhu"
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Simulation Console Terminal */}
      <form onSubmit={handleSimulateSubmit} className="border-t border-[#1e293b] bg-[#0d1421]/60 p-4 mt-auto">
        <label htmlFor="simulated-command-input" className="block text-[10px] font-mono font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
          Simulasi Masukan Perintah:
        </label>
        <div className="flex space-x-1.5">
          <input
            id="simulated-command-input"
            type="text"
            className="flex-1 bg-[#121924] border border-[#1e293b] hover:border-[#334155] text-xs text-zinc-200 placeholder-zinc-650 rounded px-3 py-2 focus:outline-none focus:border-lime-brand"
            placeholder="Ketik perintah (e.g. nyalakan semua)..."
            value={simulatedCommand}
            onChange={(e) => setSimulatedCommand(e.target.value)}
          />
          <button
            type="submit"
            className="bg-[#1a2230] hover:bg-[#121924] text-lime-brand hover:text-white border border-[#1e293b] p-2 rounded transition-colors cursor-pointer flex items-center justify-center focus:ring-1 focus:ring-lime-brand"
            disabled={!simulatedCommand.trim()}
            title="Kirim simulasi data ucapan"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
