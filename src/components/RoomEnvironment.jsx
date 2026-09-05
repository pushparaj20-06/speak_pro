import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Stars, Html, OrbitControls, Grid, Sparkles, ContactShadows, Float, Box, Sphere, Cylinder, Cone, useGLTF } from '@react-three/drei';
import { useRef, useState, useEffect, useMemo, forwardRef, memo } from 'react';
import * as THREE from 'three';
import { useRemoteParticipants, useRoomContext, useChat, useTracks, AudioTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import HumanoidAvatar from './HumanoidAvatar';
// --- MINI ROBOTS (Slow Hovering NPCs) ---
function MiniRobotNPC({ initialPos, bounds }) {
  const ref = useRef();
  const target = useRef(new THREE.Vector3(...initialPos));

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    // Wander logic
    const dist = ref.current.position.distanceTo(target.current);
    if (dist < 0.5) {
      // Pick new random target within bounds
      target.current.set(
        (Math.random() - 0.5) * bounds,
        0,
        (Math.random() - 0.5) * bounds
      );
    } else {
      // Move towards target (SLOW speed = 0.8)
      const dir = target.current.clone().sub(ref.current.position).normalize();
      ref.current.position.add(dir.multiplyScalar(delta * 0.8));
      
      // Face target
      const angle = Math.atan2(dir.x, dir.z);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, angle, 0.1);
    }
    
    // Hover bobbing animation
    ref.current.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 2 + initialPos[0]) * 0.2;
  });

  return (
    <group ref={ref} position={initialPos}>
      {/* Robot Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Robot Eye */}
      <mesh position={[0, 0.1, 0.21]}>
        <planeGeometry args={[0.2, 0.08]} />
        <meshBasicMaterial color="#14b8a6" /> {/* Cyan glow */}
      </mesh>
      {/* Antenna */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {/* Antenna Bulb */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color="#ef4444" /> {/* Red glowing tip */}
      </mesh>
      {/* Hover thruster glow */}
      <mesh position={[0, -0.21, 0]} rotation={[Math.PI/2, 0, 0]}>
        <planeGeometry args={[0.3, 0.3]} />
        <meshBasicMaterial color="#14b8a6" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// --- NATURE (TREES) ---
function PineTree({ position }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.4, 0.6, 2, 16]} />
        <meshStandardMaterial color="#4a2e00" roughness={1} />
      </mesh>
      {/* Leaves/Needles */}
      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[2, 3, 16]} />
        <meshStandardMaterial color="#0f5132" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <coneGeometry args={[1.5, 2.5, 16]} />
        <meshStandardMaterial color="#146c43" roughness={0.8} />
      </mesh>
      <mesh position={[0, 5.5, 0]}>
        <coneGeometry args={[1, 2, 16]} />
        <meshStandardMaterial color="#198754" roughness={0.8} />
      </mesh>
    </group>
  );
}

// --- DISCUSSION TABLE ---
function DiscussionTable({ tableId, position, topic, onSit, seatMap }) {
  const TABLE_RADIUS = 3.5;
  const SEAT_RADIUS = 5.5;
  
  // Generate 7 seats
  const seats = useMemo(() => {
    const s = [];
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      s.push({
        id: `${tableId}_${i}`,
        pos: [position[0] + Math.sin(angle) * SEAT_RADIUS, 0, position[2] + Math.cos(angle) * SEAT_RADIUS],
        rot: angle + Math.PI
      });
    }
    return s;
  }, [tableId, position]);

  return (
    <group>
      {/* The Table */}
      <group position={[position[0], 0.8, position[2]]}>
        <mesh>
          <cylinderGeometry args={[TABLE_RADIUS, TABLE_RADIUS - 0.2, 0.4, 64]} />
          <meshPhysicalMaterial color="#050505" roughness={0.1} metalness={0.9} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0.21, 0]}>
          <ringGeometry args={[TABLE_RADIUS - 0.3, TABLE_RADIUS, 64]} />
          <meshBasicMaterial color="#14b8a6" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[1, 1.5, 0.8, 32]} />
          <meshPhysicalMaterial color="#111" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>

      {/* Fixed Gold Topic Text */}
      <mesh position={[position[0], 2.8, position[2]]}>
        <Html position={[0, 0, 0]} center transform sprite zIndexRange={[100, 0]}>
           <div className="bg-[#2a1b00]/90 border-2 border-[#ffd700] px-6 py-2 rounded-lg text-[#ffd700] font-black text-2xl whitespace-nowrap shadow-[0_0_15px_rgba(255,215,0,0.5)] tracking-widest">
             TABLE {tableId + 1}
           </div>
        </Html>
      </mesh>

      {/* Render Empty Seats (Occupied seats are rendered by avatars globally) */}
      {seats.map(seat => {
        const isOccupied = !!seatMap[seat.id];
        if (isOccupied) return null;
        
        return (
          <group key={seat.id} position={seat.pos} rotation={[0, seat.rot, 0]}>
            <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.4, 0.4, 0.8, 32]} /><meshPhysicalMaterial color="#111" /></mesh>
            <mesh 
              position={[0, 1.2, 0]} 
              onClick={(e) => { e.stopPropagation(); onSit(seat.id, seat.pos, seat.rot); }}
              onPointerOver={(e) => { document.body.style.cursor = 'pointer'; e.object.material.opacity = 0.8; }}
              onPointerOut={(e) => { document.body.style.cursor = 'auto'; e.object.material.opacity = 0.3; }}
            >
              <cylinderGeometry args={[0.45, 0.45, 0.1, 32]} />
              <meshBasicMaterial color="#2dd4bf" transparent opacity={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// --- MOBILE VIRTUAL JOYSTICK ---
function VirtualJoystick() {
  const containerRef = useRef();
  const knobRef = useRef();
  
  const handleMove = (e) => {
    e.preventDefault();
    if (!containerRef.current || !knobRef.current) return;
    const touch = e.touches ? e.touches[0] : e;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxDist = rect.width / 2.5; // limit knob movement
    
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }
    
    knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    
    // Normalize to -1 to 1 for game engine
    window.__joystickDir = { x: dx / maxDist, y: dy / maxDist };
  };
  
  const handleEnd = (e) => {
    e.preventDefault();
    if (knobRef.current) knobRef.current.style.transform = `translate(0px, 0px)`;
    window.__joystickDir = { x: 0, y: 0 };
  };

  useEffect(() => {
    window.__joystickDir = { x: 0, y: 0 };
  }, []);

  return (
    <div className="absolute bottom-6 left-6 z-50 pointer-events-auto opacity-80 touch-none select-none">
      <div 
        ref={containerRef}
        className="relative w-36 h-36 bg-dark-900/50 rounded-full border-2 border-white/20 backdrop-blur-md shadow-[0_0_30px_rgba(20,184,166,0.2)] flex items-center justify-center overflow-hidden"
        onTouchMove={handleMove} onTouchStart={handleMove} onTouchEnd={handleEnd}
        onMouseMove={(e) => { if (e.buttons === 1) handleMove(e); }} onMouseDown={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
      >
        <div className="absolute inset-0 border-[4px] border-dashed border-white/10 rounded-full"></div>
        <div ref={knobRef} className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full shadow-[0_0_20px_#2dd4bf] transition-transform duration-75 ease-out flex items-center justify-center">
          <div className="w-6 h-6 bg-white/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

// --- LOCAL CAMERA & CONTROLLER (Camera-Relative Movement) ---
function LocalController({ localPos, setLocalPos, isSitting, isDriving }) {
  const { camera } = useThree();
  const speed = isDriving ? 18 : 8;
  const controlsRef = useRef();

  const checkCollision = (x, z) => {
    if (isDriving) {
       // Prevent cars from entering the center table area or hitting outer buildings
       const distFromCenter = Math.sqrt(x*x + z*z);
       if (distFromCenter < 38) return true; // Inner table area
       if (distFromCenter > 52) return true; // Outer buildings
       
       // Check collision against background cars
       if (window.__bgCars) {
          for (let bgCar of window.__bgCars) {
             if (!bgCar) continue;
             const dist = Math.sqrt((x - bgCar.x)**2 + (z - bgCar.z)**2);
             if (dist < 5) return true;
          }
       }
    }
    // Check against 10 tables
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const tx = Math.sin(angle) * 30;
      const tz = Math.cos(angle) * 30;
      const dist = Math.sqrt((x - tx)**2 + (z - tz)**2);
      if (dist < 4.5) return true; // Table radius 3.5 + Avatar 1.0
    }
    return false;
  };
  
  useEffect(() => {
    // Spawn camera closer behind the user for a tight 3rd person view
    camera.position.set(localPos.pos[0], localPos.pos[1] + 2, localPos.pos[2] + 4);
  }, [camera]);

  const wasSitting = useRef(false);

  useFrame((state, delta) => {
    let moved = false;
    let newPos = [...localPos.pos];
    let newRot = localPos.rot;

    if (isSitting) {
       if (!wasSitting.current) {
          const headPos = new THREE.Vector3(localPos.pos[0], 2.0, localPos.pos[2]);
          const dir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), localPos.rot);
          
          const camTargetPos = headPos.clone().addScaledVector(dir, -3.5);
          camTargetPos.y = 4.0;
          camera.position.copy(camTargetPos);
          
          if (controlsRef.current) {
             const lookAtPos = headPos.clone().addScaledVector(dir, 4.0);
             controlsRef.current.target.copy(lookAtPos);
             controlsRef.current.update();
          }
          wasSitting.current = true;
       }
       return;
    } else {
       wasSitting.current = false;
    }

    // Movement if not sitting
    if (!isSitting) {
      const jx = window.__joystickDir?.x || 0;
      const jy = window.__joystickDir?.y || 0;
      
      const keys = {
        w: state.events.handlers.keys?.w || false,
        a: state.events.handlers.keys?.a || false,
        s: state.events.handlers.keys?.s || false,
        d: state.events.handlers.keys?.d || false,
      };

      let inputX = jx;
      let inputY = jy;

      // Keyboard Fallback
      if (Math.abs(inputX) < 0.1 && Math.abs(inputY) < 0.1) {
        if (keys.w) inputY = -1;
        if (keys.s) inputY = 1;
        if (keys.a) inputX = -1;
        if (keys.d) inputX = 1;
      }

      if (Math.abs(inputX) > 0.05 || Math.abs(inputY) > 0.05) {
        // Calculate Camera Forward and Right vectors on XZ plane
        const camForward = new THREE.Vector3();
        camera.getWorldDirection(camForward);
        camForward.y = 0;
        camForward.normalize();

        const camRight = new THREE.Vector3().crossVectors(camera.up, camForward).normalize();

        // Calculate move direction relative to camera
        const moveDir = new THREE.Vector3()
          .addScaledVector(camRight, -inputX)
          .addScaledVector(camForward, -inputY);

        if (moveDir.length() > 0.01) {
          moveDir.normalize();

          // Calculate new potential position
          let nextX = newPos[0] + moveDir.x * speed * delta;
          let nextZ = newPos[2] + moveDir.z * speed * delta;

          // Collision Detection
          if (!checkCollision(nextX, nextZ)) {
             newPos[0] = nextX;
             newPos[2] = nextZ;
          } else if (!checkCollision(nextX, newPos[2])) {
             newPos[0] = nextX; // Slide along X
          } else if (!checkCollision(newPos[0], nextZ)) {
             newPos[2] = nextZ; // Slide along Z
          }

          // Rotate Avatar to face the move direction
          newRot = Math.atan2(moveDir.x, moveDir.z);
          moved = true;
        }
      }
      
      // Bounds check
      newPos[0] = Math.max(-65, Math.min(65, newPos[0]));
      newPos[2] = Math.max(-65, Math.min(65, newPos[2]));

      if (moved) {
        setLocalPos({ pos: newPos, rot: newRot, moving: true });
      } else if (localPos.moving) {
        setLocalPos({ pos: newPos, rot: newRot, moving: false });
      }
    }

    // Smoothly update OrbitControls target to follow avatar
    if (controlsRef.current) {
      const targetVec = new THREE.Vector3(localPos.pos[0], 1.5, localPos.pos[2]);
      controlsRef.current.target.lerp(targetVec, isDriving ? 0.3 : 0.1);
      controlsRef.current.update();
    }
  });

  // Track keydown globally
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!window.__keys) window.__keys = {};
      window.__keys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e) => {
      if (!window.__keys) window.__keys = {};
      window.__keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Inject keys into useFrame state
  useFrame((state) => {
    if (!state.events.handlers.keys) state.events.handlers.keys = {};
    Object.assign(state.events.handlers.keys, window.__keys);
  });

  return (
    <OrbitControls 
      ref={controlsRef}
      makeDefault 
      minPolarAngle={0.1} 
      maxPolarAngle={Math.PI / 2.1} 
      maxDistance={7} 
      minDistance={2} 
      enablePan={false}
      enableDamping={true}
      dampingFactor={0.05}
    />
  );
}

// --- CAR COMPONENT ---
const Car = forwardRef(({ color, ...props }, ref) => {
  const wheelColor = "#111";
  return (
    <group ref={ref} {...props}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.2, 0.5, 2.5]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.8, -0.2]} castShadow>
        <boxGeometry args={[1.0, 0.4, 1.2]} />
        <meshStandardMaterial color="#222" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[-0.6, 0.2, 0.8]} rotation={[0, 0, Math.PI/2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color={wheelColor} />
      </mesh>
      <mesh position={[0.6, 0.2, 0.8]} rotation={[0, 0, Math.PI/2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color={wheelColor} />
      </mesh>
      <mesh position={[-0.6, 0.2, -0.8]} rotation={[0, 0, Math.PI/2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color={wheelColor} />
      </mesh>
      <mesh position={[0.6, 0.2, -0.8]} rotation={[0, 0, Math.PI/2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        <meshStandardMaterial color={wheelColor} />
      </mesh>
      <mesh position={[-0.4, 0.4, 1.26]}>
        <planeGeometry args={[0.2, 0.1]} />
        <meshBasicMaterial color="#ffffee" />
      </mesh>
      <mesh position={[0.4, 0.4, 1.26]}>
        <planeGeometry args={[0.2, 0.1]} />
        <meshBasicMaterial color="#ffffee" />
      </mesh>
      <mesh position={[-0.4, 0.4, -1.26]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.2, 0.1]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0.4, 0.4, -1.26]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.2, 0.1]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
});
Car.displayName = "Car";

// --- CIRCLING CARS (Background) ---
function CirclingCars({ allPlayers }) {
  const carsState = useRef([
     { angle: 0, color: '#fbbf24' },
     { angle: Math.PI / 2, color: '#3b82f6' },
     { angle: Math.PI, color: '#10b981' },
     { angle: (Math.PI * 3) / 2, color: '#ec4899' }
  ]);
  const refs = [useRef(), useRef(), useRef(), useRef()];
  const radius = 46; 

  useFrame((state, delta) => {
    // Cap delta to prevent cars from teleporting through the collision zone during lag spikes or tab switches
    const safeDelta = Math.min(delta, 0.1);

    carsState.current.forEach((c, i) => {
      const futureAngle = c.angle + 0.3 * safeDelta; 
      const fx = Math.sin(futureAngle) * radius;
      const fz = Math.cos(futureAngle) * radius;
      
      let stop = false;
      if (allPlayers) {
         for (let p of allPlayers) {
            if (!p || !p.pos) continue;
            const dist = Math.sqrt((p.pos[0] - fx)**2 + (p.pos[2] - fz)**2);
            if (dist < 5) {
               stop = true;
               break;
            }
         }
      }

      // Traffic Jam Logic: Don't hit the car in front!
      for (let j = 0; j < carsState.current.length; j++) {
         if (i === j) continue;
         let angleDiff = carsState.current[j].angle - c.angle;
         while (angleDiff < 0) angleDiff += Math.PI * 2;
         
         // Widen the zone and start from 0.01 so overlapping cars can separate, and they can't jump over it
         if (angleDiff > 0.01 && angleDiff < 0.4) { 
             stop = true;
             break;
         }
      }

      if (!stop) c.angle = futureAngle;
      
      const cx = Math.sin(c.angle) * radius;
      const cz = Math.cos(c.angle) * radius;

      if (!window.__bgCars) window.__bgCars = [];
      window.__bgCars[i] = { x: cx, z: cz };
      
      if (refs[i].current) {
         refs[i].current.position.set(cx, 0, cz);
         refs[i].current.rotation.y = c.angle + Math.PI / 2;
      }
    });
  });

  return (
    <group>
      {carsState.current.map((c, i) => (
         <Car key={i} ref={refs[i]} color={c.color} />
      ))}
    </group>
  );
}

// --- ARRIVAL SEQUENCE ---
function ArrivalSequence({ phase, setPhase, onComplete }) {
  const carPos = useRef(new THREE.Vector3(-45, 0, 46));
  const { camera } = useThree();

  useFrame((state, delta) => {
    if (phase === 'driving') {
      carPos.current.x += 25 * delta;
      if (carPos.current.x >= 0) {
         carPos.current.x = 0;
         setPhase('arrived');
         setTimeout(() => setPhase('leaving'), 2000);
      }
      camera.position.set(carPos.current.x - 7, 4, carPos.current.z + 3);
      camera.lookAt(carPos.current.x + 5, carPos.current.y, carPos.current.z);
    } else if (phase === 'leaving') {
      carPos.current.x += 35 * delta;
      if (carPos.current.x > 80) {
         onComplete();
      }
    }
  });

  return (
    <Car position={[carPos.current.x, carPos.current.y, carPos.current.z]} rotation={[0, Math.PI/2, 0]} color="#ef4444" />
  );
}

// --- MOTIVATIONAL BANNERS ---
function MotivationalBanners() {
  const quotes = [
    "THE ONLY WAY TO DO GREAT WORK\nIS TO LOVE WHAT YOU DO",
    "SUCCESS IS NOT FINAL;\nFAILURE IS NOT FATAL",
    "BELIEVE YOU CAN\nAND YOU'RE HALFWAY THERE",
    "DON'T WATCH THE CLOCK.\nDO WHAT IT DOES. KEEP GOING.",
    "YOU ARE NEVER TOO OLD\nTO SET ANOTHER GOAL"
  ];

  return (
    <group>
      {quotes.map((quote, i) => {
        const angle = (i / 5) * Math.PI * 2 + Math.PI / 5;
        const radius = 39; // Inner edge of the road
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, angle + Math.PI, 0]}>
             <mesh position={[0, 4.5, 0]} castShadow>
               <boxGeometry args={[14, 5, 0.5]} />
               <meshStandardMaterial color="#111" roughness={0.3} metalness={0.8} />
             </mesh>
             {/* Glowing Edge */}
             <mesh position={[0, 4.5, -0.1]}>
               <boxGeometry args={[14.2, 5.2, 0.1]} />
               <meshBasicMaterial color="#14b8a6" />
             </mesh>
             {/* Poles */}
             <mesh position={[-6, 2, 0]} castShadow>
               <cylinderGeometry args={[0.2, 0.2, 4]} />
               <meshStandardMaterial color="#333" />
             </mesh>
             <mesh position={[6, 2, 0]} castShadow>
               <cylinderGeometry args={[0.2, 0.2, 4]} />
               <meshStandardMaterial color="#333" />
             </mesh>
             
             <Html position={[0, 4.5, 0.26]} transform center sprite scale={0.7}>
               <div className="w-[800px] px-4 text-center font-black text-5xl text-white drop-shadow-[0_0_15px_rgba(20,184,166,0.8)] leading-snug whitespace-pre-line">
                  {quote}
               </div>
             </Html>
          </group>
        );
      })}
    </group>
  );
}

const CityScenery = memo(function CityScenery() {
  const buildings = useMemo(() => {
    const b = [];
    // Generate buildings in an outer ring
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const radius = 55 + Math.random() * 15; 
      const height = 15 + Math.random() * 35;
      const width = 5 + Math.random() * 8;
      const depth = 5 + Math.random() * 8;
      b.push({
        id: i,
        pos: [Math.sin(angle) * radius, height / 2, Math.cos(angle) * radius],
        size: [width, height, depth],
        rot: -angle, 
        color: Math.random() > 0.5 ? '#1e293b' : '#0f172a' 
      });
    }
    return b;
  }, []);

  return (
    <group>
      {/* Red Circular Road outside the main arena */}
      <mesh position={[0, -0.09, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <ringGeometry args={[42, 50, 64]} />
        <meshStandardMaterial color="#ef4444" roughness={0.8} /> {/* Red Road */}
      </mesh>
      
      {/* Road Markings (Dashed lines) */}
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
         <ringGeometry args={[45.8, 46.2, 64]} />
         <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>

      {/* Buildings */}
      {buildings.map(b => (
        <group key={b.id} position={b.pos} rotation={[0, b.rot, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={b.size} />
            <meshStandardMaterial color={b.color} roughness={0.6} metalness={0.3} />
          </mesh>
          {/* Windows (simple glowing grids/planes on the front) */}
          <mesh position={[0, 0, b.size[2] / 2 + 0.05]}>
             <planeGeometry args={[b.size[0] * 0.8, b.size[1] * 0.9]} />
             <meshBasicMaterial color="#38bdf8" wireframe opacity={0.2} transparent />
          </mesh>
        </group>
      ))}
    </group>
  );
});

// --- PROXIMITY AUDIO TRACK ---
function ProximityAudioTrack({ trackRef, volume }) {
  const ref = useRef(null);
  
  useEffect(() => {
    if (!trackRef?.publication?.track) return;
    const track = trackRef.publication.track;
    const el = document.createElement('audio');
    el.autoplay = true;
    track.attach(el);
    ref.current = el;
    
    return () => {
      track.detach(el);
      el.remove();
    };
  }, [trackRef]);

  useEffect(() => {
    if (ref.current) {
      ref.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  return null;
}

// --- MAIN ARENA ---
export default function RoomEnvironment({ userProfile, localColor }) {
  const room = useRoomContext();
  const remotes = useRemoteParticipants();
  const localParticipant = room?.localParticipant;
  
  const [isDriving, setIsDriving] = useState(false);

  // States
  const [seatMap, setSeatMap] = useState({}); // { 'tableId_seatId': 'userId' }
  const [tableTopics, setTableTopics] = useState({}); // { 'tableId': 'Topic' }
  const [tableHosts, setTableHosts] = useState({}); // { 'tableId': 'userId' }
  
  // Avatars positioning network state
  const [networkPlayers, setNetworkPlayers] = useState({}); // { 'userId': { pos, rot, profile } }
  
  // Local Player State (Spawn facing the room)
  const [localState, setLocalState] = useState({ pos: [0, 0, 45], rot: 0 }); // rot 0 to face room
  const [mySeat, setMySeat] = useState(null); // 'tableId_seatId'
  const [showToast, setShowToast] = useState(null); // Full Room Message

  // Refs for network callbacks (must be declared after state)
  const seatMapRef = useRef(seatMap);
  const mySeatRef = useRef(null);
  const localStateRef = useRef(localState);

  useEffect(() => { seatMapRef.current = seatMap; }, [seatMap]);
  useEffect(() => { mySeatRef.current = mySeat; }, [mySeat]);
  useEffect(() => { localStateRef.current = localState; }, [localState]);

  // Generate 10 Tables arranged in a large circle
  const tables = useMemo(() => {
    const t = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      t.push({
        id: i,
        pos: [Math.sin(angle) * 30, 0, Math.cos(angle) * 30],
        defaultTopic: `Discussion Table ${i+1}`
      });
    }
    return t;
  }, []);

  // Generate Robots (Replaced Pets)
  const robots = useMemo(() => {
    const r = [];
    for(let i=0; i<15; i++) r.push({ id: `robot_${i}`, pos: [(Math.random()-0.5)*100, 0, (Math.random()-0.5)*100] });
    return r;
  }, []);

  // Networking Loop
  useEffect(() => {
    if (!room) return;

    // Listen for local topic updates from GDArenaUI
    const handleLocalTopic = (e) => {
      if (e.detail) {
        setTableTopics(prev => ({ ...prev, [e.detail.tableId]: e.detail.topic }));
      }
    };
    window.addEventListener('UPDATE_TOPIC_LOCAL', handleLocalTopic);

    // Broadcast local state continuously so late joiners instantly see us
    const interval = setInterval(() => {
      const currentState = localStateRef.current;
      if (localParticipant && room && room.state === 'connected') {
        const payload = JSON.stringify({ 
          type: 'MOVE', 
          pos: currentState.pos, 
          rot: currentState.rot, 
          profile: userProfile,
          isDriving,
          mySeat: mySeatRef.current
        });
        try {
          localParticipant.publishData(new TextEncoder().encode(payload), { reliable: false });
        } catch (error) {
          console.warn("Failed to publish MOVE data:", error);
        }
      }
    }, 150);

    const handleDataReceived = (payload, participant) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === 'MOVE') {
          setNetworkPlayers(prev => ({
            ...prev,
            [participant.identity]: { pos: data.pos, rot: data.rot, profile: data.profile, isDriving: data.isDriving }
          }));
          if (data.mySeat !== undefined) {
             setSeatMap(prev => {
                const next = { ...prev };
                // Clear any old seats for this user
                Object.keys(next).forEach(k => { if (next[k] === participant.identity) delete next[k]; });
                // Set new seat if sitting
                if (data.mySeat) next[data.mySeat] = participant.identity;
                return next;
             });
          }
        } else if (data.type === 'SYNC_GLOBAL') {
          if (data.seats) setSeatMap(data.seats);
          if (data.topics) setTableTopics(prev => ({ ...prev, ...data.topics }));
          if (data.hosts) setTableHosts(data.hosts);
        } else if (data.type === 'ACTION_SIT') {
          setSeatMap(prev => ({ ...prev, [data.seatId]: participant.identity }));
          // If table has no host, this guy becomes host
          const tableId = parseInt(data.seatId.split('_')[0]);
          setTableHosts(prev => {
            if (!prev[tableId]) return { ...prev, [tableId]: participant.identity };
            return prev;
          });
        } else if (data.type === 'ACTION_STAND') {
          setSeatMap(prev => {
            const next = {...prev};
            delete next[data.seatId];
            return next;
          });
        } else if (data.type === 'TABLE_CHAT') {
          // Verify if they are at my table
          const myCurrentTable = mySeatRef.current ? parseInt(mySeatRef.current.split('_')[0]) : null;
          if (myCurrentTable !== null) {
             let senderTableId = null;
             Object.keys(seatMapRef.current).forEach(key => {
               if (seatMapRef.current[key] === participant.identity) {
                  senderTableId = parseInt(key.split('_')[0]);
               }
             });
             if (senderTableId === myCurrentTable) {
                window.dispatchEvent(new CustomEvent('TABLE_CHAT_RECEIVED', {
                   detail: { 
                     id: Date.now() + Math.random(),
                     sender: participant.identity, 
                     message: data.message,
                     timestamp: Date.now(),
                     senderName: data.senderName
                   }
                }));
             }
          }
        } else if (data.type === 'TABLE_EMOTE') {
          const myCurrentTable = mySeatRef.current ? parseInt(mySeatRef.current.split('_')[0]) : null;
          if (myCurrentTable !== null && data.tableId === myCurrentTable) {
             window.dispatchEvent(new CustomEvent('TABLE_EMOTE_RECEIVED', {
                detail: { sender: participant.identity, emote: data.emote }
             }));
          }
        }
      } catch (e) {}
    };

    room.on('dataReceived', handleDataReceived);
    return () => {
      clearInterval(interval);
      window.removeEventListener('UPDATE_TOPIC_LOCAL', handleLocalTopic);
      room.off('dataReceived', handleDataReceived);
    };
  }, [room, userProfile, localParticipant, isDriving]);

  // Actions
  const handleSit = (seatId, pos, rot) => {
    // Check if table is full globally or if they can sit.
    // 10 tables * 7 seats = 70. 
    if (Object.keys(seatMap).length >= 70) {
       setShowToast("ROOM FULL! ALL 70 SEATS OCCUPIED. PLEASE WAIT.");
       setTimeout(() => setShowToast(null), 3000);
       return; // Prevent sitting
    }

    // Stand up from old seat if any
    if (mySeat) {
       handleStand();
    }
    setMySeat(seatId);
    setLocalState({ pos, rot }); // Snap to seat
    
    // Notify UI
    const tableId = parseInt(seatId.split('_')[0]);
    window.dispatchEvent(new CustomEvent('SEAT_CHANGED', { detail: { tableId, isHost: tableHosts[tableId] === localParticipant?.identity || !tableHosts[tableId] } }));

    // Sync
    if (localParticipant) {
       // Optimistic local update
       setSeatMap(prev => ({ ...prev, [seatId]: localParticipant.identity }));
       setTableHosts(prev => {
          if (!prev[tableId]) return { ...prev, [tableId]: localParticipant.identity };
          return prev;
       });

       const payload = JSON.stringify({ type: 'ACTION_SIT', seatId });
       localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
    }
  };

  const handleStand = () => {
    if (!mySeat) return;
    const oldSeat = mySeat;
    setMySeat(null);
    window.dispatchEvent(new CustomEvent('SEAT_CHANGED', { detail: null }));
    
    if (localParticipant) {
      setSeatMap(prev => {
        const next = {...prev};
        delete next[oldSeat];
        return next;
      });
      const payload = JSON.stringify({ type: 'ACTION_STAND', seatId: oldSeat });
      localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
    }
  };

  // --- SPATIAL AUDIO MANAGER ---
  // Only play audio of users who are sitting at the exact SAME table as the local user.
  const myTableId = mySeat ? parseInt(mySeat.split('_')[0]) : null;
  const audioTracks = useTracks([Track.Source.Microphone]) || [];

  const allPlayersList = useMemo(() => {
     return [
       localState,
       ...Object.values(networkPlayers)
     ];
  }, [localState, networkPlayers]);

  return (
    <div className="absolute inset-0 z-0 w-full h-full">
      {/* Dynamic Audio Partitioning based on Table */}
      {audioTracks.map((trackRef) => {
        if (!trackRef?.participant || trackRef.participant.isLocal) return null; // Don't hear yourself
        
        // Find which table this remote user is sitting at
        let theirTableId = null;
        if (seatMap) {
          Object.keys(seatMap).forEach(key => {
            if (seatMap[key] === trackRef.participant.identity) {
               theirTableId = parseInt(key.split('_')[0]);
            }
          });
        }

        // Table Chat (Both seated at the SAME table) - 100% Volume
        if (myTableId !== null && theirTableId === myTableId) {
           return <AudioTrack key={trackRef.publication?.trackSid || trackRef.participant.identity} trackRef={trackRef} />;
        }
        
        // Proximity Spatial Chat (Both walking around) - Volume based on distance
        if (myTableId === null && theirTableId === null) {
           const theirState = networkPlayers[trackRef.participant.identity];
           if (theirState && theirState.pos) {
              const dx = localState.pos[0] - theirState.pos[0];
              const dz = localState.pos[2] - theirState.pos[2];
              const distance = Math.sqrt(dx*dx + dz*dz);
              
              if (distance < 20) {
                 const volume = 1.0 - (distance / 20);
                 return <ProximityAudioTrack key={trackRef.publication?.trackSid || trackRef.participant.identity} trackRef={trackRef} volume={volume} />;
              }
           }
        }
        return null;
      })}

      <Canvas>
        <LocalController localPos={localState} setLocalPos={setLocalState} isSitting={!!mySeat} isDriving={isDriving} />
        
        <Environment preset="forest" />
        <ambientLight intensity={0.3} color="#ffffff" />
        
        {/* Left Side: SUN */}
        <group position={[-60, 40, -20]}>
          <directionalLight intensity={2} color="#ffaa00" castShadow />
          <mesh>
            <sphereGeometry args={[5, 32, 32]} />
            <meshBasicMaterial color="#ffaa00" />
          </mesh>
          <Sparkles count={50} scale={15} size={10} color="#ffaa00" />
        </group>

        {/* Right Side: MOON */}
        <group position={[60, 40, 20]}>
          <directionalLight intensity={1} color="#4488ff" castShadow />
          <mesh>
            <sphereGeometry args={[4, 32, 32]} />
            <meshBasicMaterial color="#4488ff" />
          </mesh>
          <Sparkles count={50} scale={10} size={5} color="#4488ff" />
        </group>

        {/* Giant SPEAK PRO Sky Hologram */}
        <Float speed={1.5} floatIntensity={2} floatingRange={[1, 5]}>
          <mesh position={[0, 80, -80]}>
            <Html center transform sprite zIndexRange={[0, -10]}>
              <div className="flex flex-col items-center justify-center animate-pulse">
                <h1 className="text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-white to-primary-400 tracking-[0.2em] drop-shadow-[0_0_80px_#2dd4bf] opacity-80" style={{ WebkitTextStroke: '2px rgba(255,255,255,0.5)' }}>
                  SPEAK PRO
                </h1>
                <div className="w-[800px] h-2 bg-gradient-to-r from-transparent via-primary-500 to-transparent mt-4 opacity-50 shadow-[0_0_30px_#2dd4bf]"></div>
              </div>
            </Html>
          </mesh>
        </Float>
        
        {/* Massive Gray Floor */}
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
          <planeGeometry args={[150, 150]} />
          <meshStandardMaterial color="#555555" roughness={1} /> {/* Gray Floor */}
        </mesh>

        {/* Outer City Environment & Red Road */}
        <CityScenery />
        
        {/* 4 Cars Driving in a loop on the red road, stopping for pedestrians */}
        <CirclingCars allPlayers={allPlayersList} />

        {/* Stone Pathways */}
        <group position={[0, -0.05, 0]}>
          {/* Main Circular Ring connecting all 10 tables */}
          <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
            <ringGeometry args={[27, 33, 64]} />
            <meshStandardMaterial color="#8c7b66" roughness={1} /> {/* Stone/Gravel color */}
          </mesh>
          {/* Entry Path connecting Welcome Zone to the Ring */}
          <mesh position={[0, 0, 39]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
            <planeGeometry args={[6, 12]} />
            <meshStandardMaterial color="#8c7b66" roughness={1} />
          </mesh>
        </group>

        {/* Center Grass Patch (Fills inner circle of 10 tables) */}
        <mesh position={[0, -0.08, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
          <circleGeometry args={[27, 64]} />
          <meshStandardMaterial color="#1a4d22" roughness={1} /> {/* Dark Green Grass */}
        </mesh>

        {/* 4 Center Trees */}
        <PineTree position={[6, 0, 6]} />
        <PineTree position={[-6, 0, 6]} />
        <PineTree position={[6, 0, -6]} />
        <PineTree position={[-6, 0, -6]} />

        {/* Welcome Spawn Zone at [0, 0, 45] */}
        <group position={[0, 0, 45]}>
           <mesh position={[0, 0.05, -2]} rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[10, 20]} />
             <meshStandardMaterial color="#8B0000" roughness={0.8} /> {/* Red Carpet */}
           </mesh>
           <Html position={[0, 3, 0]} center transform sprite zIndexRange={[10, 0]}>
             <div className="text-white font-black text-4xl bg-black/50 px-6 py-2 rounded-2xl border-4 border-[#ffd700] whitespace-nowrap shadow-[0_0_30px_#ffd700]">
               WELCOME TO SPEAK PRO
             </div>
           </Html>
        </group>

        {/* Render 10 Tables */}
        {tables.map(table => (
          <DiscussionTable 
            key={table.id} 
            tableId={table.id} 
            position={table.pos} 
            topic={tableTopics[table.id] || table.defaultTopic} 
            onSit={handleSit}
            seatMap={seatMap}
          />
        ))}

        {/* Render Robots */}
        {robots.map(robot => (
           <MiniRobotNPC key={robot.id} initialPos={robot.pos} bounds={100} />
        ))}

        {/* Render Remote Players */}
        {remotes.map((remote, idx) => {
          // Fallback position if they haven't moved yet (so they are always visible)
          const state = networkPlayers[remote.identity] || { pos: [idx * 3 - 5, 0, 42], rot: 0, profile: {} };
          
          let isRemoteHost = false;
          Object.keys(seatMap).forEach(key => {
            if (seatMap[key] === remote.identity) {
               const tid = parseInt(key.split('_')[0]);
               if (tableHosts[tid] === remote.identity) isRemoteHost = true;
            }
          });

          return (
            <HumanoidAvatar 
              key={remote.identity} 
              participant={remote} 
              profile={state.profile || { nickname: remote.identity.split('-')[0], gender: 'Male' }} 
              position={state.pos} 
              rotation={state.rot} 
              isLocal={false}
              isHost={isRemoteHost}
            />
          );
        })}

        {/* Render Local Player */}
        {localParticipant && !isDriving && (
          <HumanoidAvatar 
            participant={localParticipant} 
            profile={userProfile} 
            position={localState.pos} 
            rotation={localState.rot} 
            isLocal={true}
            isHost={mySeat ? tableHosts[parseInt(mySeat.split('_')[0])] === localParticipant.identity : false}
          />
        )}
        {localParticipant && isDriving && (
          <Car position={localState.pos} rotation={[0, localState.rot, 0]} color={localColor || "#ef4444"} />
        )}
      </Canvas>

      {/* Driving Toggle Button */}
      {!mySeat && Math.sqrt(localState.pos[0]**2 + localState.pos[2]**2) > 38 && (
        <button 
          onClick={() => {
             const nextDrive = !isDriving;
             setIsDriving(nextDrive);
             if (localParticipant) {
                const payload = JSON.stringify({ type: 'MOVE', pos: localState.pos, rot: localState.rot, profile: userProfile, isDriving: nextDrive });
                localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
             }
          }}
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full font-black tracking-wide shadow-2xl transition-all hover:scale-105 pointer-events-auto flex items-center gap-2 ${isDriving ? 'bg-red-500 text-white' : 'bg-primary-500 text-dark-900'}`}
        >
          {isDriving ? '🚶‍♂️ EXIT CAR' : '🚗 DRIVE CAR'}
        </button>
      )}

      {/* Stand Up Overlay Button if Sitting */}
      {mySeat && (
        <button 
          onClick={handleStand}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 bg-red-500 hover:bg-red-400 text-white font-bold px-6 py-3 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)] pointer-events-auto transition-transform hover:scale-105"
        >
          STAND UP & LEAVE TABLE
        </button>
      )}
      
      {/* Mobile Controls */}
      {!mySeat && (
        <VirtualJoystick />
      )}

      {/* Global Notifications (Room Full) */}
      {showToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-red-600 text-white font-black px-8 py-4 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.8)] border-4 border-white animate-bounce text-center pointer-events-none">
          {showToast}
        </div>
      )}
    </div>
  );
}
