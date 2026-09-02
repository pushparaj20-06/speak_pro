import { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import HumanoidAvatar from '../components/HumanoidAvatar';
import { getUserProfile, saveUserProfile } from '../lib/db';
import { auth } from '../lib/firebase';
import { DoorOpen, User, PaintBucket } from 'lucide-react';

export default function Lobby() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('speakpro-room');
  const [nickname, setNickname] = useState(() => 'User' + Math.floor(Math.random() * 1000));
  const [gender, setGender] = useState('Male');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [skinColor, setSkinColor] = useState('#fcd34d');
  const [loading, setLoading] = useState(true);

  // Fetch saved profile
  useEffect(() => {
    const loadProfile = async () => {
      const userId = auth?.currentUser?.uid || 'mock-user';
      const profile = await getUserProfile(userId);
      if (profile) {
        if (profile.nickname) setNickname(profile.nickname);
        if (profile.gender) setGender(profile.gender);
        if (profile.primaryColor) setPrimaryColor(profile.primaryColor);
        if (profile.skinColor) setSkinColor(profile.skinColor);
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomName.trim() || !nickname.trim()) return;
    
    setLoading(true);
    const userId = auth?.currentUser?.uid || 'mock-user';
    const profileData = { nickname, gender, primaryColor, skinColor };
    
    // Save to db (which handles localStorage for mock mode)
    await saveUserProfile(userId, profileData);
    
    // Also save directly to localStorage so Room.jsx can read it synchronously
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    
    navigate(`/room/${roomName}`, { 
      state: { participantName: nickname, profile: profileData } 
    });
  };

  const currentProfile = { nickname, gender, primaryColor, skinColor };

  return (
    <div className="flex h-screen w-full bg-dark-900 text-white overflow-hidden flex-col md:flex-row font-sans">
      
      {/* LEFT: 3D Avatar Preview Canvas */}
      <div className="relative w-full md:w-[60%] h-[50vh] md:h-full bg-dark-900 flex items-center justify-center overflow-hidden">
         {/* Background Styling */}
         <div className="absolute inset-0 bg-gradient-to-br from-dark-800 to-dark-950"></div>
         <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent"></div>
         
         <div className="absolute top-8 left-8 z-10 pointer-events-none">
           <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 drop-shadow-[0_0_15px_rgba(20,184,166,0.5)]">
              <DoorOpen className="text-primary-500" size={40} />
              SPEAK PRO
           </h1>
           <p className="text-primary-300/80 mt-2 font-bold tracking-[0.2em] uppercase text-xs ml-1">3D Virtual Arena</p>
         </div>

         <div className="w-full h-full cursor-move">
           <Canvas camera={{ position: [0, 1.2, 3], fov: 45 }} className="w-full h-full">
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
              <directionalLight position={[-5, 5, -5]} intensity={0.5} />
              <Suspense fallback={null}>
                 <HumanoidAvatar profile={currentProfile} position={[0, -0.6, 0]} rotation={0} />
                 <Environment preset="city" />
                 <ContactShadows position={[0, -0.6, 0]} opacity={0.4} scale={10} blur={2} far={4} resolution={256} />
              </Suspense>
              <OrbitControls 
                 enableZoom={true} 
                 minDistance={2} 
                 maxDistance={6}
                 enablePan={false} 
                 minPolarAngle={Math.PI/3} 
                 maxPolarAngle={Math.PI/2} 
              />
           </Canvas>
         </div>
         
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-gray-400 text-xs tracking-wider opacity-60 pointer-events-none">
           Drag to rotate avatar
         </div>
      </div>

      {/* RIGHT: Configuration Panel */}
      <div className="w-full md:w-[40%] h-[50vh] md:h-full bg-dark-800/90 backdrop-blur-3xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-20 flex flex-col overflow-y-auto">
         <form onSubmit={handleJoin} className="p-8 md:p-12 flex flex-col gap-8 flex-1 justify-center max-w-md mx-auto w-full">
            
            <div>
               <h2 className="text-3xl font-bold mb-2 text-white">Avatar Setup</h2>
               <p className="text-gray-400 text-sm">Customize your look before entering.</p>
            </div>

            {/* Room Name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase ml-1">Room Name</label>
              <input 
                type="text" 
                required
                className="bg-dark-900 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              />
            </div>

            {/* Nickname */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase ml-1 flex items-center gap-2"><User size={14}/> Display Name</label>
              <input 
                type="text" 
                required
                className="bg-dark-900 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            {/* Gender / Hair Style */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 tracking-wider uppercase ml-1">Hair Style</label>
              <div className="flex gap-4">
                 <button 
                   type="button"
                   onClick={() => setGender('Male')}
                   className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${gender === 'Male' ? 'bg-primary-500 text-dark-900 shadow-[0_0_15px_rgba(45,212,191,0.4)]' : 'bg-dark-900 text-gray-400 border border-white/10 hover:border-primary-500/50'}`}
                 >
                   Short Hair
                 </button>
                 <button 
                   type="button"
                   onClick={() => setGender('Female')}
                   className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${gender === 'Female' ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'bg-dark-900 text-gray-400 border border-white/10 hover:border-pink-500/50'}`}
                 >
                   Long Hair
                 </button>
              </div>
            </div>

            {/* Colors */}
            <div className="flex gap-4">
               <div className="flex-1 flex flex-col gap-2">
                 <label className="text-xs font-bold text-gray-400 tracking-wider uppercase ml-1 flex items-center gap-2"><PaintBucket size={14}/> Dress Color</label>
                 <div className="p-1.5 bg-dark-900 border border-white/10 rounded-xl focus-within:border-primary-500 transition-colors">
                   <input 
                     type="color" 
                     value={primaryColor}
                     onChange={(e) => setPrimaryColor(e.target.value)}
                     className="w-full h-12 bg-transparent rounded-lg cursor-pointer"
                   />
                 </div>
               </div>
               <div className="flex-1 flex flex-col gap-2">
                 <label className="text-xs font-bold text-gray-400 tracking-wider uppercase ml-1 flex items-center gap-2"><PaintBucket size={14}/> Skin Color</label>
                 <div className="p-1.5 bg-dark-900 border border-white/10 rounded-xl focus-within:border-primary-500 transition-colors">
                   <input 
                     type="color" 
                     value={skinColor}
                     onChange={(e) => setSkinColor(e.target.value)}
                     className="w-full h-12 bg-transparent rounded-lg cursor-pointer"
                   />
                 </div>
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-6 bg-white text-dark-900 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 font-black text-lg px-6 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] flex justify-center items-center w-full"
            >
              ENTER ROOM
            </button>
         </form>
      </div>
    </div>
  );
}
