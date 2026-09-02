import { useState, useEffect } from 'react';
import { useRoomContext, useLocalParticipant, useRemoteParticipants } from '@livekit/components-react';
import { Clock, Play, MicOff, Edit3 } from 'lucide-react';

export default function GDArenaUI() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const remotes = useRemoteParticipants();
  
  const [topic, setTopic] = useState('Future of AI in Ethics');
  const [timer, setTimer] = useState(0); // in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [currentTableId, setCurrentTableId] = useState(null);

  // Sync Logic
  useEffect(() => {
    // Listen for seat changes from the 3D environment
    const handleSeatChange = (e) => {
      if (e.detail) {
        setCurrentTableId(e.detail.tableId);
        setIsHost(e.detail.isHost);
      } else {
        setCurrentTableId(null);
        setIsHost(false);
      }
    };
    window.addEventListener('SEAT_CHANGED', handleSeatChange);

    if (!room) return;

    // Check if we are the host (Fallback logic if RoomEnvironment handles it, we can also check here)
    // If you are alone or became host
    if (remotes.length === 0 && localParticipant && !isHost) {
      setIsHost(true);
    }

    const handleDataReceived = (payload, participant) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === 'SYNC_ARENA') {
          // If syncing table state, we should ideally have table-specific state.
          // For simplicity in UI, if it's our table, we sync it.
          if (data.tableId === currentTableId) {
             setTopic(data.topic);
             setTimer(data.timer);
             setTimerActive(data.timerActive);
          }
        } else if (data.type === 'SET_TOPIC' && data.tableId === currentTableId) {
          setTopic(data.topic);
        } else if (data.type === 'START_TIMER' && data.tableId === currentTableId) {
          setTimer(data.duration);
          setTimerActive(true);
        } else if (data.type === 'STOP_TIMER' && data.tableId === currentTableId) {
          setTimerActive(false);
        }
      } catch (e) {}
    };

    const handleParticipantConnected = () => {
      if (isHost && room.localParticipant) {
        const payload = JSON.stringify({ type: 'SYNC_ARENA', topic, timer, timerActive });
        room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
      }
    };

    window.addEventListener('SEAT_CHANGED', handleSeatChange);
    room.on('dataReceived', handleDataReceived);
    return () => {
      window.removeEventListener('SEAT_CHANGED', handleSeatChange);
      room.off('dataReceived', handleDataReceived);
    };
  }, [room, isHost, topic, timer, timerActive, currentTableId]);

  // Timer Tick
  useEffect(() => {
    let interval = null;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => (t > 0 ? t - 1 : 0));
      }, 1000);
    } else if (timer === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  // Host Controls
  const handleChangeTopic = () => {
    const newTopic = prompt("Enter new discussion topic for Table " + (currentTableId + 1) + ":", topic);
    if (newTopic && newTopic.trim() !== "") {
      setTopic(newTopic);
      
      // Update local 3D scene immediately
      window.dispatchEvent(new CustomEvent('UPDATE_TOPIC_LOCAL', { detail: { tableId: currentTableId, topic: newTopic } }));

      if (room?.localParticipant) {
        // Send SET_TOPIC for this specific table
        const payload = JSON.stringify({ type: 'SET_TOPIC', tableId: currentTableId, topic: newTopic });
        room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
      }
    }
  };

  const handleToggleTimer = () => {
    if (timerActive) {
      setTimerActive(false);
      if (room?.localParticipant) {
        const payload = JSON.stringify({ type: 'STOP_TIMER', tableId: currentTableId });
        room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
      }
    } else {
      const input = window.prompt("Enter timer duration in minutes:", "5");
      if (input !== null) {
        let mins = parseInt(input);
        if (isNaN(mins) || mins <= 0) mins = 5;
        const duration = mins * 60;
        setTimer(duration);
        setTimerActive(true);
        if (room?.localParticipant) {
          const payload = JSON.stringify({ type: 'START_TIMER', tableId: currentTableId, duration });
          room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
        }
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
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
      
      {/* Central Glass Panel - Smaller & Sleeker */}
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
        </div>

      </div>

    </div>
  );
}
