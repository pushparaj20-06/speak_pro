import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';

function AnimatedShapes() {
  const sphereRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (sphereRef.current) {
      sphereRef.current.rotation.x = time * 0.2;
      sphereRef.current.rotation.y = time * 0.3;
    }
  });

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Main floating distorted sphere */}
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <Sphere ref={sphereRef} visible args={[1, 100, 200]} scale={2} position={[0, 0, -2]}>
          <MeshDistortMaterial 
            color="#2dd4bf" 
            attach="material" 
            distort={0.4} 
            speed={2} 
            roughness={0.2}
            metalness={0.8}
            wireframe={true}
          />
        </Sphere>
      </Float>
      
      {/* Background Orbs */}
      <Float speed={1.5} rotationIntensity={1.5} floatIntensity={3}>
        <Sphere args={[1, 32, 32]} scale={0.8} position={[-4, 2, -5]}>
          <meshStandardMaterial color="#0f766e" roughness={0.1} metalness={0.5} />
        </Sphere>
      </Float>
      <Float speed={2.5} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere args={[1, 32, 32]} scale={1.2} position={[4, -2, -6]}>
          <meshStandardMaterial color="#115e59" roughness={0.3} metalness={0.8} />
        </Sphere>
      </Float>
    </>
  );
}

export default function Background3D() {
  return (
    <div className="absolute inset-0 -z-10 w-full h-full bg-dark-900 overflow-hidden pointer-events-none">
      {/* Subtle gradient blobs in the background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-900/30 blur-[120px] animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-800/20 blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>
      
      {/* Three.js Canvas */}
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <Environment preset="city" />
        <AnimatedShapes />
      </Canvas>
    </div>
  );
}
