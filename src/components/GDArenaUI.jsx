import { useState, useEffect } from 'react';
import { Clock, Play, Edit3 } from 'lucide-react';

export default function GDArenaUI({ roomData, updateArenaState, myTableId, sendEmote, identity }) {
  // Use state from props
  const topic = roomData?.topic || 'Future of AI in Ethics';
  const timer = roomData?.timer || 0;
  const timerActive = roomData?.timerActive || false;
  
  const currentTableId = myTableId;
  const isHost = true; // For now, everyone at the table can change topics in Firebase mode

  // Timer Tick (only host needs to drive this, but for simplicity anyone can if it's active)
  useEffect(() => {
    let interval = null;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        updateArenaState(topic, timer > 0 ? timer - 1 : 0, timerActive);
      }, 1000);
    } else if (timer === 0 && timerActive) {
      updateArenaState(topic, 0, false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer, topic, updateArenaState]);

  // Host Controls
  const handleChangeTopic = () => {
    const newTopic = prompt("Enter new discussion topic for Table " + (currentTableId + 1) + ":", topic);
    if (newTopic && newTopic.trim() !== "") {
      updateArenaState(newTopic, timer, timerActive);
      // Update local 3D scene immediately
      window.dispatchEvent(new CustomEvent('UPDATE_TOPIC_LOCAL', { detail: { tableId: currentTableId, topic: newTopic } }));
    }
  };

  const handleToggleTimer = () => {
    if (timerActive) {
      updateArenaState(topic, timer, false);
    } else {
      const input = window.prompt("Enter timer duration in minutes:", "5");
      if (input !== null) {
        let mins = parseInt(input);
        if (isNaN(mins) || mins <= 0) mins = 5;
        const duration = mins * 60;
        updateArenaState(topic, duration, true);
      }
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Only render if the user is sitting at a table
  if (currentTableId === null) return null;

  return (
    <>
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
        
        {/* Central Glass Panel */}
        <div className="glass-panel px-6 py-3 rounded-2xl border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] bg-dark-900/80 backdrop-blur-3xl flex items-center gap-6 pointer-events-auto">
          
          {/* Topic Info */}
          <div className="flex flex-col items-start max-w-[200px] overflow-hidden">
            <div className="flex items-center gap-2">
              <h3 className="text-primary-400 text-[10px] font-bold tracking-widest uppercase">Table {currentTableId + 1}</h3>
              {isHost && (
                <button onClick={handleChangeTopic} className="text-gray-400 hover:text-primary-400 transition-colors">
                  <Edit3 size={12} />
                </button>
              )}
            </div>
            <h1 className="text-white text-lg font-bold truncate w-full" title={topic}>{topic}</h1>
          </div>
          
          <div className="w-[1px] h-10 bg-white/10"></div>
          
          {/* Timer */}
          <div className="flex items-center gap-3">
            <Clock size={16} className={timerActive ? "text-red-400 animate-pulse" : "text-gray-400"} />
            <span className={`text-xl font-mono font-black ${timerActive ? 'text-red-400' : 'text-gray-300'}`}>
              {formatTime(timer)}
            </span>
            {isHost && (
               <button 
                 onClick={handleToggleTimer} 
                 className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${timerActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/40'}`}
               >
                 {timerActive ? <div className="w-3 h-3 bg-red-400 rounded-sm"></div> : <Play size={14} className="ml-1" />}
               </button>
            )}
            <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('SEAT_CHANGED', { detail: null }));
                // We also need to tell RoomEnvironment to trigger handleStand so mySeat becomes null!
                window.dispatchEvent(new CustomEvent('STAND_UP_LOCAL'));
              }}
              className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-xs font-bold tracking-widest transition-colors"
            >
              LEAVE
            </button>
          </div>

        </div>
      </div>

      {/* Emoji Bar */}
      <div className="fixed top-1/2 left-4 md:left-auto md:right-[400px] -translate-y-1/2 flex flex-col gap-3 pointer-events-auto z-40 bg-dark-900/40 p-3 rounded-full backdrop-blur-md border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        {['👍', '❤️', '😂', '👏', '🔥', '🤔'].map(emoji => (
          <button 
            key={emoji}
            onClick={() => {
              // Local visual instantly
              window.dispatchEvent(new CustomEvent('TABLE_EMOTE_RECEIVED', { detail: { emote: emoji, sender: identity } })); 
              sendEmote(emoji);
            }}
            className="w-10 h-10 bg-dark-800/80 hover:bg-primary-500/80 rounded-full border border-white/10 flex items-center justify-center text-xl transition-transform hover:scale-110 shadow-lg"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
