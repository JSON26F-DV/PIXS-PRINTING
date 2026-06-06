import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, useScroll, Environment, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Create abstract cards/paper sheets outside the component to avoid impure functions during render
const cards = Array.from({ length: 15 }, (_, i) => {
  const angle = (i / 15) * Math.PI * 2;
  const radius = 3 + Math.random() * 2;
  return {
    position: [Math.cos(angle) * radius, (Math.random() - 0.5) * 10, Math.sin(angle) * radius],
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
    scale: 0.5 + Math.random() * 1.5,
  };
});

const Cards = () => {
  const scroll = useScroll();
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      // Rotate the entire group slowly
      group.current.rotation.y += delta * 0.1;
      
      // Animate based on scroll (using `scroll.offset` from useScroll)
      const offset = scroll.offset; // 0 to 1
      group.current.position.y = offset * 10;
      group.current.rotation.x = offset * Math.PI * 0.5;
    }
  });

  return (
    <group ref={group}>
      {cards.map((props, i) => (
        <Float key={i} speed={2} rotationIntensity={1.5} floatIntensity={2}>
          <mesh 
            position={props.position as [number, number, number]} 
            rotation={props.rotation as [number, number, number]} 
            scale={props.scale}
          >
            {/* Box to represent a thick card/paper */}
            <boxGeometry args={[2, 3, 0.02]} />
            <meshStandardMaterial 
              color={i % 3 === 0 ? "#00e5ff" : i % 3 === 1 ? "#222222" : "#ffffff"} 
              roughness={0.1} 
              metalness={0.5} 
              envMapIntensity={1.5}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

const ThreeDScene = () => {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 35 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Environment preset="city" />
      {/* ScrollControls lets Drei manage scroll state within the canvas context */}
      <ScrollControls pages={3} damping={0.2}>
        <Cards />
      </ScrollControls>
      <ContactShadows position={[0, -5, 0]} opacity={0.5} scale={20} blur={2} far={10} />
    </Canvas>
  );
};

export default ThreeDScene;
