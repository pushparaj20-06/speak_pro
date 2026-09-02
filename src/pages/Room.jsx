import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { LiveKitRoom, useLocalParticipant } from '@livekit/components-react';
import { MessageSquare, X, Mic, MicOff, Send } from 'lucide-react';
import VideoGrid from '../components/VideoGrid';
import RoomEnvironment from '../components/RoomEnvironment';
import GDArenaUI from '../components/GDArenaUI';
import '@livekit/components-styles';

function CustomAudioControls() {
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const toggleMic = () => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <button 
        onClick={toggleMic}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all hover:scale-105 ${isMicrophoneEnabled ? 'bg-green-500 text-white shadow-[0_0_20px_#10b981]' : 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]'}`}
      >
        {isMicrophoneEnabled ? <Mic size={24} /> : <MicOff size={24} />}
      </button>
    </div>
  );
}

function EmoteBar({ myTableId }) {
  const { localParticipant } = useLocalParticipant();
  if (myTableId === null || !localParticipant) return null;

  const sendEmote = (emoji) => {
    const payload = JSON.stringify({ 
      type: 'TABLE_EMOTE', 
      tableId: myTableId, 
      emote: emoji, 
      senderName: localParticipant.identity.split('-')[0] 
    });
    localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
    
    // Dispatch local event so we see our own emote immediately
    const myEmote = { sender: localParticipant.identity, emote: emoji };
    window.dispatchEvent(new CustomEvent('TABLE_EMOTE_RECEIVED', { detail: myEmote }));
  };

  const emotes = ['👏', '🔥', '👍', '💡'];
  
  return (
    <div className="absolute top-1/2 -translate-y-1/2 right-4 z-50 flex flex-col gap-3">
      {emotes.map(e => (
        <button 
          key={e} 
          onClick={() => sendEmote(e)} 
          className="bg-dark-900/80 backdrop-blur border border-white/20 hover:border-primary-500 rounded-full w-12 h-12 flex items-center justify-center text-2xl hover:scale-110 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]"
          title={`Send ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function CustomTableChat({ myTableId }) {
  const { localParticipant } = useLocalParticipant();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  useEffect(() => {
     const handleChat = (e) => setMessages(prev => [...prev, e.detail]);
     window.addEventListener('TABLE_CHAT_RECEIVED', handleChat);
     return () => window.removeEventListener('TABLE_CHAT_RECEIVED', handleChat);
  }, []);

  const send = (e) => {
     e.preventDefault();
     if (!input.trim() || !localParticipant || myTableId === null) return;
     
     const payload = JSON.stringify({
        type: 'TABLE_CHAT',
        message: input,
        senderName: localParticipant.identity.split('-')[0]
     });
     localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
     
     const myMsg = {
        id: Date.now() + Math.random(),
        sender: localParticipant.identity,
        message: input,
        timestamp: Date.now(),
        senderName: 'You'
     };
     setMessages(prev => [...prev, myMsg]);
     window.dispatchEvent(new CustomEvent('TABLE_CHAT_RECEIVED', { detail: myMsg }));
     setInput('');
  };

  if (myTableId === null) {
     return (
       <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-dark-900/50">
         <MessageSquare size={48} className="text-gray-600 mb-4" />
         <h3 className="text-white font-bold text-lg mb-2">No Table Selected</h3>
         <p className="text-gray-400 text-sm">Please walk to a table and click <strong>SIT HERE</strong> to join the private chat.</p>
       </div>
     );
  }

  return (
    <div className="flex flex-col h-full bg-dark-900/50">
       <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(m => {
             const isMe = m.sender === localParticipant?.identity;
             return (
               <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-400 font-bold mb-1 ml-1">{m.senderName}</span>
                  <div className={`px-4 py-2 rounded-2xl text-sm shadow-md max-w-[90%] break-words ${isMe ? 'bg-primary-500 text-dark-900 rounded-tr-sm' : 'bg-dark-700 text-white border border-white/10 rounded-tl-sm'}`}>
                     {m.message}
                  </div>
               </div>
             );
          })}
       </div>
       <form onSubmit={send} className="p-3 border-t border-white/10 bg-dark-800 flex gap-2 items-center">
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            className="flex-1 bg-dark-900 border border-white/20 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors" 
            placeholder={`Message Table ${myTableId + 1}...`} 
          />
          <button type="submit" className="bg-primary-500 hover:bg-primary-400 text-dark-900 p-2.5 rounded-full transition-transform hover:scale-110 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
            <Send size={18} />
          </button>
       </form>
    </div>
  );
}

export default function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const participantName = location.state?.participantName || 'Guest';
  const environmentTheme = location.state?.environment || 'apartment';
  const avatarShape = location.state?.avatarShape || 'box';
  const avatarColor = location.state?.avatarColor || '#2dd4bf';

  // Profile Data
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : { nickname: 'Guest', gender: 'Male', age: 18 };
  });
  
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState(import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880');
  const [connected, setConnected] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [error] = useState(null);
  
  // Track which table the local user is sitting at
  const [myTableId, setMyTableId] = useState(null);

  useEffect(() => {
    const handleSeat = (e) => setMyTableId(e.detail ? e.detail.tableId : null);
    window.addEventListener('SEAT_CHANGED', handleSeat);
    return () => window.removeEventListener('SEAT_CHANGED', handleSeat);
  }, []);

  useEffect(() => {
    // Automatically try to fetch token from backend
    const fetchToken = async () => {
        // Use VITE_BACKEND_URL if set (important for APK builds). Otherwise, use empty string (relative path) for Vercel deployments.
        const backendUrl = import.meta.env.VITE_BACKEND_URL || ''; 
        const res = await fetch(`${backendUrl}/api/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: roomId || 'demo-room', participantName })
        });
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
          setConnected(true);
        } else {
          throw new Error('No token received');
        }
      } catch (_err) {
        console.warn('Backend server not running. Falling back to Demo Mode.');
        setConnected(true); // Proceed anyway for UI demo purposes
      }
    };
    fetchToken();
  }, [roomId, participantName]);

  if (error) return <div className="min-h-screen flex items-center justify-center bg-dark-900 text-red-500">{error}</div>;

  if (connected) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col">
        <header className="glass-panel rounded-none border-t-0 border-l-0 border-r-0 border-b border-white/20 px-4 py-3 md:px-6 md:py-4 flex justify-between items-center z-30 bg-black/40 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <h2 className="text-lg md:text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-cyan-400 flex items-center gap-2 md:gap-3 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]">
            <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-primary-500 shadow-[0_0_15px_#2dd4bf] animate-pulse"></span>
            SPEAK PRO
          </h2>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => navigate('/lobby')} 
              className="text-white hover:text-white font-bold tracking-wide px-5 py-2.5 md:px-6 bg-red-500/80 hover:bg-red-500 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] text-sm md:text-base"
            >
              LEAVE
            </button>
          </div>
        </header>
        
        <main className="flex-1 relative flex flex-col items-center overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-900/10 blur-[120px] pointer-events-none"></div>
          
          <LiveKitRoom
            video={false}
            audio={true}
            token={token || 'mock-token'}
            serverUrl={serverUrl}
            connect={connected}
            onDisconnected={() => console.log('Disconnected')}
            className="w-full h-full relative"
          >
            <CustomAudioControls />
            <EmoteBar myTableId={myTableId} />

            {/* 3D Metaverse Arena */}
            <GDArenaUI />
            <RoomEnvironment 
              theme={environmentTheme} 
              localShape={avatarShape} 
              localColor={avatarColor} 
              userProfile={userProfile} 
            />

            <div className="flex-1 relative flex flex-col h-full w-full overflow-hidden pointer-events-none">
              <VideoGrid />
            </div>
            
            {/* Custom Top Right Mute Button */}
            <CustomAudioControls />
            
            {/* Floating Action Button for Chat */}
            <button 
              onClick={() => setShowChat(!showChat)} 
              className="absolute bottom-6 right-6 z-40 bg-primary-500 hover:bg-primary-400 text-dark-900 p-4 rounded-full shadow-[0_0_20px_#14b8a6] transition-transform hover:scale-110 flex items-center justify-center pointer-events-auto"
            >
              {showChat ? <X size={24} /> : <MessageSquare size={24} />}
            </button>

            {/* Custom Floating Chat Window */}
            <div className={`
              absolute bottom-24 right-6 w-[350px] h-[450px] border border-white/20 bg-dark-900/80 backdrop-blur-3xl rounded-2xl flex flex-col z-30 shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden pointer-events-auto
              transition-all duration-300 origin-bottom-right
              ${showChat ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}
            `}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-dark-800/60">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className={myTableId !== null ? "text-primary-400" : "text-gray-400"} />
                  <span className="font-black text-white tracking-widest text-sm">
                    {myTableId !== null ? `TABLE ${myTableId + 1} CHAT` : 'PRIVATE CHAT'}
                  </span>
                </div>
                {myTableId !== null && (
                  <span className="bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded text-xs font-bold border border-primary-500/30">SECURE</span>
                )}
              </div>
              <CustomTableChat myTableId={myTableId} />
            </div>
          </LiveKitRoom>
        </main>
      </div>
    );
  }

  // Loading state while fetching token or falling back to demo mode
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-dark-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-900/20 via-dark-900 to-dark-900"></div>
      
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary-900/20 blur-[100px] animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary-800/10 blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin shadow-[0_0_20px_rgba(20,184,166,0.3)]"></div>
        <h2 className="text-xl font-medium text-white animate-pulse">Connecting to Space...</h2>
      </div>
    </div>
  );
}
