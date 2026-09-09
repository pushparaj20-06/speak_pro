import { useEffect, useState, useRef, useCallback } from 'react';
import { rtdb } from '../lib/firebase';
import { ref, set, onValue, onDisconnect, update, serverTimestamp, remove, push } from 'firebase/database';

export function useFirebaseMultiplayer(roomId, participantName, initialProfile) {
  const [networkPlayers, setNetworkPlayers] = useState({});
  const [roomData, setRoomData] = useState({ topic: '', timer: 0, timerActive: false });
  const [chatMessages, setChatMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const mySeatRef = useRef(null);

  // We append a random ID to the participant name to allow multiple users with same name (if needed)
  const identityRef = useRef(`${participantName}-${Math.floor(Math.random() * 10000)}`);
  const identity = identityRef.current;

  // Real-time synchronization of players
  useEffect(() => {
    if (!rtdb || !roomId) return;
    const roomRef = ref(rtdb, `rooms/${roomId}/players`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNetworkPlayers(data);
      } else {
        setNetworkPlayers({});
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Handle connection state and cleanup
  useEffect(() => {
    if (!rtdb || !roomId) return;
    const connectedRef = ref(rtdb, '.info/connected');
    const myPlayerRef = ref(rtdb, `rooms/${roomId}/players/${identity}`);

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        setConnected(true);
        // Remove player on disconnect
        onDisconnect(myPlayerRef).remove();
        
        // Initial setup
        set(myPlayerRef, {
          profile: initialProfile,
          pos: [0, 0, 0],
          rot: 0,
          isDriving: false,
          mySeat: null,
          lastUpdate: serverTimestamp()
        });
      } else {
        setConnected(false);
      }
    });

    return () => {
      remove(myPlayerRef);
      unsubscribe();
    };
  }, [roomId, identity, initialProfile]);

  // Sync Room Topic and Timers
  useEffect(() => {
    if (!rtdb || !roomId) return;
    const arenaRef = ref(rtdb, `rooms/${roomId}/arena`);
    const unsubscribe = onValue(arenaRef, (snap) => {
      if (snap.val()) {
        setRoomData(snap.val());
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  // Sync Chat Messages
  useEffect(() => {
    if (!rtdb || !roomId) return;
    const chatRef = ref(rtdb, `rooms/${roomId}/chat`);
    const unsubscribe = onValue(chatRef, (snap) => {
      if (snap.val()) {
        // Convert object to array and sort by timestamp
        const msgs = Object.values(snap.val()).sort((a, b) => a.timestamp - b.timestamp);
        // Only keep last 50 messages to prevent huge states
        setChatMessages(msgs.slice(-50));
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  const updatePosition = useCallback((pos, rot, isDriving) => {
    if (!connected || !rtdb || !roomId) return;
    update(ref(rtdb, `rooms/${roomId}/players/${identity}`), {
      pos,
      rot,
      isDriving,
      mySeat: mySeatRef.current,
      lastUpdate: serverTimestamp()
    });
  }, [roomId, connected, identity]);

  const updateSeat = useCallback((seatInfo) => {
    mySeatRef.current = seatInfo;
    if (!connected || !rtdb || !roomId) return;
    update(ref(rtdb, `rooms/${roomId}/players/${identity}`), {
      mySeat: seatInfo,
      satAt: seatInfo ? serverTimestamp() : null
    });
  }, [roomId, connected, identity]);

  const sendChatMessage = useCallback((message, senderName) => {
    if (!rtdb || !roomId) return;
    const chatRef = ref(rtdb, `rooms/${roomId}/chat`);
    push(chatRef, {
      id: Date.now(),
      senderName,
      message,
      timestamp: Date.now() // Note: client side time for simplicity in sorting
    });
  }, [roomId]);

  const updateArenaState = useCallback((topic, timer, timerActive) => {
    if (!rtdb || !roomId) return;
    update(ref(rtdb, `rooms/${roomId}/arena`), {
      topic,
      timer,
      timerActive,
      lastUpdate: serverTimestamp()
    });
  }, [roomId]);

  const sendEmote = useCallback((emote) => {
    if (!rtdb || !roomId) return;
    update(ref(rtdb, `rooms/${roomId}/players/${identity}`), {
      emote: { emoji: emote, time: serverTimestamp() }
    });
  }, [roomId, identity]);

  return {
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
  };
}
