import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useIsSpeaking } from '@livekit/components-react';

export default function HumanoidAvatar(props) {
  if (!props.participant) {
    return <HumanoidAvatarModel {...props} isSpeaking={false} />;
  }
  return <HumanoidAvatarWithLiveKit {...props} />;
}

function HumanoidAvatarWithLiveKit(props) {
  const isSpeaking = useIsSpeaking(props.participant);
  return <HumanoidAvatarModel {...props} isSpeaking={isSpeaking} />;
}

function HumanoidAvatarModel({ participant, profile, position, rotation, isLocal, isHost, isSpeaking }) {
  const groupRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const [activeMessage, setActiveMessage] = useState(null);
  const [activeEmote, setActiveEmote] = useState(null);

  // Profile parsing
  const isFemale = profile?.gender === 'Female';
  const primaryColor = profile?.primaryColor || (isFemale ? '#ec4899' : '#3b82f6'); 
  const skinColor = profile?.skinColor || '#fcd34d'; 

  useEffect(() => {
    if (!participant?.identity) return;
    
    const handleChat = (e) => {
      if (e.detail.sender === participant.identity) {
         setActiveMessage(e.detail.message);
         setTimeout(() => setActiveMessage(null), 5000);
      }
    };
    const handleEmote = (e) => {
      if (e.detail.sender === participant.identity) {
         setActiveEmote(e.detail.emote);
         setTimeout(() => setActiveEmote(null), 3000);
      }
    };
    window.addEventListener('TABLE_CHAT_RECEIVED', handleChat);
    window.addEventListener('TABLE_EMOTE_RECEIVED', handleEmote);
    return () => {
      window.removeEventListener('TABLE_CHAT_RECEIVED', handleChat);
      window.removeEventListener('TABLE_EMOTE_RECEIVED', handleEmote);
    };
  }, [participant?.identity]);

  // Breathing & Walking Animation
  const timeOffset = useRef(Math.random() * 100);
  useFrame((state) => {
    if (groupRef.current) {
      // Lerp position/rotation for smooth movement
      if (position) {
         groupRef.current.position.lerp(new THREE.Vector3(...position), 0.1);
      }
      if (rotation !== undefined) {
         groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotation, 0.1);
      }
      
      // Breathing bob
      let isWalking = false;
      if (position) {
        const targetPos = new THREE.Vector3(...position);
        const dx = groupRef.current.position.x - targetPos.x;
        const dz = groupRef.current.position.z - targetPos.z;
        isWalking = Math.sqrt(dx*dx + dz*dz) > 0.02;
      }
      
      const bobSpeed = isWalking ? 10 : 2;
      const bobAmount = isWalking ? 0.1 : 0.05;
      const baseY = position ? position[1] : 0;
      groupRef.current.position.y = baseY + Math.sin(state.clock.elapsedTime * bobSpeed + timeOffset.current) * bobAmount;

      // Limb Animation
      if (leftArmRef.current && rightArmRef.current && leftLegRef.current && rightLegRef.current) {
        if (isWalking) {
          const walkTime = state.clock.elapsedTime * 15;
          leftArmRef.current.rotation.x = Math.sin(walkTime) * 1.2;
          rightArmRef.current.rotation.x = Math.sin(walkTime + Math.PI) * 1.2;
          leftLegRef.current.rotation.x = Math.sin(walkTime + Math.PI) * 1.2;
          rightLegRef.current.rotation.x = Math.sin(walkTime) * 1.2;
        } else {
          leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.2);
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.2);
          leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.2);
          rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.2);
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={position || [0,0,0]} rotation={[0, rotation || 0, 0]}>
      {/* Speaking Aura */}
      {isSpeaking && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial color="#14b8a6" transparent opacity={0.4} wireframe />
        </mesh>
      )}

      {/* Head */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshPhysicalMaterial color={skinColor} roughness={0.3} metalness={0.1} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.15, 1.7, 0.45]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[0.15, 1.7, 0.45]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#111" />
      </mesh>

      {/* Hair / Hat (Different for Gender) */}
      {isFemale ? (
        <mesh position={[0, 2.0, -0.1]} rotation={[-0.2, 0, 0]}>
          <coneGeometry args={[0.55, 0.8, 32]} />
          <meshPhysicalMaterial color="#3b1a00" roughness={0.9} /> {/* Brown hair */}
        </mesh>
      ) : (
        <mesh position={[0, 1.9, 0.05]}>
          <boxGeometry args={[0.45, 0.2, 0.45]} />
          <meshPhysicalMaterial color="#111" roughness={0.9} /> {/* Black hair */}
        </mesh>
      )}

      {/* Torso */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 1.0, 32]} />
        <meshPhysicalMaterial color={primaryColor} roughness={0.8} />
      </mesh>
      
      {/* Arms */}
      <group position={[-0.4, 0.9, 0]} rotation={[0, 0, 0]}>
        <group ref={leftArmRef}>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
            <meshPhysicalMaterial color={skinColor} roughness={0.3} />
          </mesh>
        </group>
      </group>
      <group position={[0.4, 0.9, 0]} rotation={[0, 0, 0]}>
        <group ref={rightArmRef}>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.6, 16]} />
            <meshPhysicalMaterial color={skinColor} roughness={0.3} />
          </mesh>
        </group>
      </group>
      
      {/* Legs (Animated when walking) */}
      <group position={[0, 0.4, 0]}>
        <group position={[-0.15, 0, 0]}>
          <group ref={leftLegRef}>
             <mesh position={[0, -0.3, 0]}>
               <cylinderGeometry args={[0.1, 0.08, 0.6, 16]} />
               <meshPhysicalMaterial color="#333" roughness={0.9} />
             </mesh>
          </group>
        </group>
        <group position={[0.15, 0, 0]}>
          <group ref={rightLegRef}>
             <mesh position={[0, -0.3, 0]}>
               <cylinderGeometry args={[0.1, 0.08, 0.6, 16]} />
               <meshPhysicalMaterial color="#333" roughness={0.9} />
             </mesh>
          </group>
        </group>
      </group>

      {/* Host Badge */}
      {isHost && (
        <Float speed={2} floatIntensity={0.5} floatingRange={[0.1, 0.3]}>
          <Html position={[0, 2.8, 0]} center transform sprite zIndexRange={[100, 0]}>
            <div className="text-4xl filter drop-shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-pulse" title="Table Host">
              👑
            </div>
          </Html>
        </Float>
      )}

      {/* Name Tag */}
      {profile?.nickname && (
        <Html position={[0, -0.2, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-dark-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium border border-white/20 whitespace-nowrap shadow-xl">
            {profile.nickname} {isLocal ? '(You)' : ''}
          </div>
        </Html>
      )}

      {/* Emote Bubble */}
      {activeEmote && (
        <Html position={[0, 2.5, 0]} center transform sprite zIndexRange={[100, 0]}>
          <div className="text-5xl animate-bounce filter drop-shadow-xl">{activeEmote}</div>
        </Html>
      )}

      {/* Chat Bubble */}
      {activeMessage && (
        <Html position={[0, 3.2, 0]} center transform sprite zIndexRange={[100, 0]}>
          <div className="bg-white/90 backdrop-blur-md text-dark-900 px-4 py-2 rounded-2xl rounded-bl-none text-sm font-bold shadow-2xl max-w-[200px] text-center border border-gray-200">
            {activeMessage}
          </div>
        </Html>
      )}
    </group>
  );
}
