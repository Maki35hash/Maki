import React, { useState } from 'react';
import { useLiveSession } from './hooks/useLiveSession';
import Visualizer from './components/Visualizer';
import ControlPanel from './components/ControlPanel';
import { ConnectionState } from './types';

function App() {
  const { 
    connect, 
    disconnect, 
    connectionState, 
    isMuted, 
    toggleMute, 
    volumeLevel 
  } = useLiveSession();

  const [selectedText, setSelectedText] = useState<string | null>(null);

  const PRACTICE_TEXTS = [
    {
        title: "The Rainbow Passage",
        excerpt: "When the sunlight strikes raindrops in the air, they act like a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors."
    },
    {
        title: "Hamlet (Act 3, Scene 2)",
        excerpt: "Speak the speech, I pray you, as I pronounced it to you, trippingly on the tongue: but if you mouth it, as many of your players do, I had as lief the town-crier spoke my lines."
    },
    {
        title: "Pride and Prejudice",
        excerpt: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife."
    }
  ];

  return (
    <div className="min-h-screen bg-royal-900 text-slate-200 font-sans selection:bg-gold-500 selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_rgba(30,41,59,1)_0%,_rgba(15,23,42,1)_100%)]" />

      <main className="relative z-10 container mx-auto px-4 py-8 flex flex-col items-center min-h-screen">
        
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in-down">
          <div className="inline-block p-1 mb-4 rounded-full bg-gradient-to-tr from-gold-600 to-gold-400">
            <div className="px-4 py-1 text-xs font-bold tracking-widest uppercase rounded-full bg-royal-900 text-gold-400">
              AI Powered Coach
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-4 tracking-tight">
            Elio
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-light italic tracking-wide">
            "Perfection through Patience."
          </p>
        </header>

        {/* Main Interface */}
        <div className="w-full max-w-2xl">
            
            {/* Visualizer Area */}
            <div className="relative aspect-square md:aspect-video w-full flex items-center justify-center mb-8">
                {connectionState === ConnectionState.CONNECTED ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                         {/* Elio 'Face' */}
                         <Visualizer volume={volumeLevel} isActive={true} />
                         <p className="mt-4 text-gold-400/80 font-serif text-sm tracking-widest uppercase">Listening</p>
                    </div>
                ) : (
                    <div className="text-center opacity-40">
                         <div className="w-32 h-32 rounded-full border-2 border-slate-700 mx-auto flex items-center justify-center mb-4">
                            <span className="font-serif text-4xl italic text-slate-600">E</span>
                         </div>
                         <p className="text-slate-500">Elio is currently offline.</p>
                    </div>
                )}
            </div>

            {/* Status Messages */}
            {connectionState === ConnectionState.ERROR && (
                <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-200 text-center text-sm">
                    Connection interrupted. Please ensure your microphone is accessible and try again.
                </div>
            )}

            {/* Practice Material */}
            {connectionState === ConnectionState.CONNECTED && !selectedText && (
                 <div className="animate-fade-in-up mb-8">
                    <p className="text-center text-slate-400 mb-4 text-sm uppercase tracking-widest">Select a script to begin</p>
                    <div className="grid gap-3">
                        {PRACTICE_TEXTS.map((t, i) => (
                            <button 
                                key={i}
                                onClick={() => setSelectedText(t.excerpt)}
                                className="text-left p-4 rounded-lg border border-slate-700 bg-royal-800/50 hover:border-gold-500/50 hover:bg-royal-800 transition-all group"
                            >
                                <h3 className="text-gold-400 font-serif text-lg group-hover:text-gold-300">{t.title}</h3>
                                <p className="text-slate-400 text-sm line-clamp-1">{t.excerpt}</p>
                            </button>
                        ))}
                         <button 
                            onClick={() => setSelectedText("Free conversation mode.")}
                            className="text-center p-4 rounded-lg border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-all"
                        >
                            Or just speak freely...
                        </button>
                    </div>
                 </div>
            )}

            {/* Active Script Display */}
            {connectionState === ConnectionState.CONNECTED && selectedText && (
                <div className="mb-8 p-8 rounded-xl bg-gradient-to-br from-royal-800 to-royal-900 border border-slate-700 shadow-2xl">
                    <h3 className="text-xs font-bold text-gold-500 uppercase tracking-widest mb-4">Active Script</h3>
                    <p className="font-serif text-2xl md:text-3xl leading-relaxed text-slate-200">
                        {selectedText}
                    </p>
                    <div className="mt-6 flex justify-between items-end">
                        <button 
                            onClick={() => setSelectedText(null)}
                            className="text-xs text-slate-500 hover:text-white underline decoration-slate-600 hover:decoration-white transition-all"
                        >
                            Change Script
                        </button>
                    </div>
                </div>
            )}

            {/* Controls */}
            <ControlPanel 
                connectionState={connectionState}
                onConnect={connect}
                onDisconnect={() => {
                    disconnect();
                    setSelectedText(null);
                }}
                isMuted={isMuted}
                onToggleMute={toggleMute}
            />

            {/* Instructions */}
            {connectionState === ConnectionState.DISCONNECTED && (
                 <div className="mt-16 grid md:grid-cols-3 gap-8 text-center px-4">
                    <div>
                        <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-royal-800 flex items-center justify-center text-gold-500 font-serif">1</div>
                        <h3 className="font-serif text-white mb-2">Speak</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Read the script or speak naturally. Elio listens for phonemic precision.</p>
                    </div>
                    <div>
                        <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-royal-800 flex items-center justify-center text-gold-500 font-serif">2</div>
                        <h3 className="font-serif text-white mb-2">Correct</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Elio interrupts gently to correct specific sounds (the 'T', the 'R', the vowels).</p>
                    </div>
                    <div>
                        <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-royal-800 flex items-center justify-center text-gold-500 font-serif">3</div>
                        <h3 className="font-serif text-white mb-2">Perfect</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Repeat until the accent is flawless. Patience is the key to mastery.</p>
                    </div>
                 </div>
            )}
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-12 text-center text-slate-600 text-xs">
            <p>Powered by Google Gemini Live API</p>
        </footer>
      </main>
    </div>
  );
}

export default App;