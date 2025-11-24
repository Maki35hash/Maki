import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState } from '../types';
import { createPcmBlob, decode, decodeAudioData } from '../utils/audioUtils';

const API_KEY = process.env.API_KEY || '';

const ELIO_SYSTEM_INSTRUCTION = `
You are Elio, a world-class British Elocutionist. 
Your personality is sophisticated, patient, yet exacting. You speak with a flawless Received Pronunciation (RP) accent.

YOUR MISSION:
Help the user master the British accent by correcting their "Micro-Mistakes".

CORE BEHAVIORS:
1.  **Listen Intently:** Analyze the user's speech for Americanisms (e.g., Flapping 'T's in "water", Hard 'R's in "car", flat vowels).
2.  **The Perfection Loop:** If a user makes a mistake, stop them immediately. politely point out the error, and ask them to repeat the specific word or syllable until it matches RP standards. Do not let them proceed to a new sentence until the current one is at least 90% accurate.
3.  **Physiological Tips:** Give physical instructions. 
    *   Example: "Drop your jaw slightly."
    *   Example: "Keep the tip of your tongue behind your top teeth for the 'T'."
    *   Example: "Round your lips more for the 'O'."
4.  **Positive Reinforcement:** When they get it right, offer elegant praise (e.g., "Splendid," "Impeccable," "Much improved").
5.  **Conciseness:** Keep your responses relatively short to allow maximum practice time for the user.

TONE:
Like a supportive but strict drama school teacher. Use words like "Ameliorate," "Enunciate," "Cadence."
`;

export function useLiveSession() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0); // For visualizer (0-100)
  
  // Audio Contexts
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  
  // Streaming Refs
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Analyser for visualizer
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const disconnect = useCallback(async () => {
    // Stop all scheduled audio
    scheduledSourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    scheduledSourcesRef.current.clear();

    // Close contexts
    if (inputContextRef.current) {
        await inputContextRef.current.close();
        inputContextRef.current = null;
    }
    if (outputContextRef.current) {
        await outputContextRef.current.close();
        outputContextRef.current = null;
    }

    // Stop tracks
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    // Stop visualizer
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    
    setConnectionState(ConnectionState.DISCONNECTED);
    setVolumeLevel(0);
  }, []);

  const connect = useCallback(async () => {
    try {
      setConnectionState(ConnectionState.CONNECTING);

      // Initialize GenAI
      const ai = new GoogleGenAI({ apiKey: API_KEY });

      // Setup Audio Contexts
      // Input: 16kHz for speech recognition optimization
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      // Output: 24kHz for high quality TTS response
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // Setup Visualizer Analyser
      const analyser = outputCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup Input Processing
      const source = inputCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Use ScriptProcessor for raw PCM access (bufferSize, inputChannels, outputChannels)
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = scriptProcessor;

      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination); // Required for script processor to run

      // Start Visualizer Loop
      const updateVisualizer = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setVolumeLevel(average); // Scale roughly 0-100 based on byte data (0-255)
        
        animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

      // Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } // Fenrir sounds deeper/authoritative
            },
            systemInstruction: ELIO_SYSTEM_INSTRUCTION,
        },
        callbacks: {
            onopen: () => {
                setConnectionState(ConnectionState.CONNECTED);
                console.log('Gemini Live Connected');
            },
            onmessage: async (message: LiveServerMessage) => {
                // Handle Audio Output from Model
                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                
                if (base64Audio && outputCtx) {
                    try {
                        const audioBuffer = await decodeAudioData(
                            decode(base64Audio),
                            outputCtx,
                            24000,
                            1
                        );
                        
                        // Schedule playback
                        const bufferSource = outputCtx.createBufferSource();
                        bufferSource.buffer = audioBuffer;
                        
                        // Connect to analyser for visualization and then destination
                        bufferSource.connect(analyser);
                        analyser.connect(outputCtx.destination);
                        
                        // Handle timing to prevent gaps
                        const currentTime = outputCtx.currentTime;
                        const startTime = Math.max(nextStartTimeRef.current, currentTime);
                        
                        bufferSource.start(startTime);
                        nextStartTimeRef.current = startTime + audioBuffer.duration;
                        
                        // Track active sources
                        scheduledSourcesRef.current.add(bufferSource);
                        bufferSource.onended = () => {
                            scheduledSourcesRef.current.delete(bufferSource);
                        };
                    } catch (err) {
                        console.error("Error decoding audio:", err);
                    }
                }

                // Handle Interruption
                if (message.serverContent?.interrupted) {
                    console.log('Model interrupted');
                    scheduledSourcesRef.current.forEach(src => {
                        try { src.stop(); } catch(e) {}
                    });
                    scheduledSourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                }
            },
            onclose: () => {
                console.log('Gemini Live Closed');
                disconnect();
            },
            onerror: (err) => {
                console.error('Gemini Live Error', err);
                setConnectionState(ConnectionState.ERROR);
                disconnect();
            }
        }
      });

      // Hook up input streaming
      scriptProcessor.onaudioprocess = (e) => {
        if (isMuted) return; // Don't send if muted
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        
        sessionPromise.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
        });
      };

    } catch (error) {
        console.error("Failed to connect:", error);
        setConnectionState(ConnectionState.ERROR);
    }
  }, [disconnect, isMuted]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
        disconnect();
    };
  }, [disconnect]);

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  return {
    connect,
    disconnect,
    connectionState,
    isMuted,
    toggleMute,
    volumeLevel
  };
}
