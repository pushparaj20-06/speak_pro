import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import RoomEnvironment from '../components/RoomEnvironment';
import { MessageSquare, X, Mic, MicOff } from 'lucide-react';
import GDArenaUI from '../components/GDArenaUI';
import { useFirebaseMultiplayer } from '../hooks/useFirebaseMultiplayer';
import AgoraRTC, { AgoraRTCProvider, useRTCClient, useLocalMicrophoneTrack, usePublish, useJoin, useRemoteUsers, useRemoteAudioTracks, RemoteAudioTrack } from "agora-rtc-react";

// Initialize Agora Client
const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

// Plays audio for all remote users
function AgoraRemoteAudio() {
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  return (
    <>
      {audioTracks.map((track) => (
        <RemoteAudioTrack key={track.getUserId()} play track={track} />
      ))}
    </>
  );
}

// Agora Voice Component
function AgoraVoiceControls({ channelName }) {
  const [micOn, setMicOn] = useState(false);
  const appId = import.meta.env.VITE_AGORA_APP_ID;

  // Always join the channel so you can hear others. 
  // We use uid: null so Agora assigns a unique integer ID automatically (avoiding string UID errors).
  useJoin({ appid: appId, channel: channelName, token: null, uid: null }, true);
  
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  usePublish([localMicrophoneTrack]);

  return (
    <div className="absolute top-6 right-6 z-40 bg-dark-900/80 backdrop-blur-xl border border-white/20 p-2 md:p-3 rounded-full flex gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <button 
        onClick={() => setMicOn(!micOn)}
        className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
          micOn 
            ? 'bg-primary-500 text-dark-900 shadow-[0_0_15px_#2dd4bf]' 
            : 'bg-dark-800 text-red-500 hover:bg-dark-700'
        }`}
      >
        {micOn ? <Mic size={20} /> : <MicOff size={20} />}
      </button>
    </div>
  );
}


function CustomTableChat({ myTableId, chatMessages, sendChatMessage, participantName }) {
  const [input, setInput] = useState('');

  const send = (e) => {
    e.preventDefault();
    if (!input.trim() || myTableId === null) return;

    sendChatMessage(input, participantName);
    setInput('');
  };

  if (myTableId === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
        <MessageSquare size={32} className="mb-4 opacity-50" />
        <p>Sit at a table to chat securely with others.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.senderName === participantName ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-gray-500 mb-1 font-medium tracking-wider px-1 uppercase">{msg.senderName}</span>
            <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] ${
              msg.senderName === participantName
                ? 'bg-primary-600 text-white rounded-tr-sm shadow-[0_2px_10px_rgba(20,184,166,0.3)]' 
                : 'bg-dark-800 text-gray-200 border border-white/5 rounded-tl-sm'
            }`}>
              {msg.message}
            </div>
          </div>
        ))}
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
          <MessageSquare size={18} />
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
  const [userProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : { nickname: participantName, gender: 'Male', age: 18 };
  });

  const [showChat, setShowChat] = useState(false);
  const [myTableId, setMyTableId] = useState(null);

  const {
    networkPlayers,
    roomData,
    chatMessages,
    connected,
    identity,
    updatePosition,
    updateSeat,
    sendChatMessage,
    updateArenaState,
    sendEmote
  } = useFirebaseMultiplayer(roomId || 'speakpro-room', participantName, userProfile);

  // Listen for seat changes from local player
  useEffect(() => {
    const handleSeat = (e) => {
      const seat = e.detail ? e.detail : null;
      setMyTableId(seat ? seat.tableId : null);
      updateSeat(seat);
    };
    window.addEventListener('SEAT_CHANGED', handleSeat);
    return () => window.removeEventListener('SEAT_CHANGED', handleSeat);
  }, [updateSeat]);


  if (!connected) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center bg-dark-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-900/20 via-dark-900 to-dark-900"></div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin shadow-[0_0_20px_rgba(20,184,166,0.3)]"></div>
          <h2 className="text-xl font-medium text-white animate-pulse">Connecting to World...</h2>
        </div>
      </div>
    );
  }

  return (
    <AgoraRTCProvider client={agoraClient}>
      <AgoraRemoteAudio />
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

          <div className="absolute inset-0">
            <AgoraVoiceControls channelName={myTableId !== null ? `${roomId}_table_${myTableId}` : `${roomId}_global`} />

            {/* 3D Metaverse Arena */}
            <GDArenaUI 
              roomData={roomData} 
              updateArenaState={updateArenaState} 
              myTableId={myTableId} 
              sendEmote={sendEmote}
              identity={identity}
            />
            
            <RoomEnvironment
              theme={environmentTheme}
              localShape={avatarShape}
              localColor={avatarColor}
              userProfile={userProfile}
              networkPlayers={networkPlayers}
              identity={identity}
              updatePosition={updatePosition}
            />

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
              <CustomTableChat 
                myTableId={myTableId} 
                chatMessages={chatMessages} 
                sendChatMessage={sendChatMessage} 
                participantName={participantName} 
              />
            </div>
          </div>
        </main>
      </div>
    </AgoraRTCProvider>
  );
}
