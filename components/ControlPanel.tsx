import React from 'react';
import { ConnectionState } from '../types';

interface ControlPanelProps {
  connectionState: ConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  connectionState, 
  onConnect, 
  onDisconnect, 
  isMuted, 
  onToggleMute 
}) => {
  if (connectionState === ConnectionState.DISCONNECTED || connectionState === ConnectionState.ERROR) {
    return (
      <div className="flex justify-center mt-8">
        <button
          onClick={onConnect}
          className="group relative inline-flex items-center justify-center px-8 py-4 font-serif text-lg font-bold text-white transition-all duration-200 bg-transparent border-2 border-gold-400 rounded-full hover:bg-gold-400 hover:text-royal-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-400 focus:ring-offset-royal-900"
        >
          <span className="absolute inset-0 w-full h-full -mt-1 rounded-full opacity-30 bg-gradient-to-b from-transparent via-transparent to-black group-hover:opacity-10"></span>
          <span className="relative flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
            Begin Elocution Session
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-6 mt-8">
      {connectionState === ConnectionState.CONNECTING ? (
        <div className="flex items-center gap-3 text-gold-400 animate-pulse">
            <span>Connecting to Elio...</span>
        </div>
      ) : (
        <>
            <button
                onClick={onToggleMute}
                className={`p-4 rounded-full border transition-all ${isMuted ? 'bg-red-900/20 border-red-500 text-red-400' : 'bg-royal-800 border-slate-600 text-slate-300 hover:border-gold-400 hover:text-gold-400'}`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
                {isMuted ? (
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                   </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                    </svg>
                )}
            </button>

            <button
                onClick={onDisconnect}
                className="px-6 py-3 font-medium text-red-400 transition-colors bg-transparent border border-red-900 rounded-full hover:bg-red-900/20 hover:border-red-500"
            >
                End Session
            </button>
        </>
      )}
    </div>
  );
};

export default ControlPanel;