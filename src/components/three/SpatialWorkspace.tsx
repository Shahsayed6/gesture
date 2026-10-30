import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useStudio } from '../../context/StudioContext';
import { Box, Circle, Cylinder, Orbit, Sparkles, Layers, RotateCw, ZoomIn, Camera } from 'lucide-react';
import { soundEffects } from '../../services/soundEffects';

type Shape3DType = 'cube' | 'sphere' | 'cylinder' | 'torus' | 'knot' | 'dodecahedron';
type MaterialType = 'hologram' | 'wireframe' | 'chrome' | 'neon';

export const SpatialWorkspace: React.FC = () => {
  const { activeHands, setActiveMode, addElement } = useStudio();
  const mountRef = useRef<HTMLDivElement>(null);

  const [activeShape, setActiveShape] = useState<Shape3DType>('knot');
  const [activeMaterial, setActiveMaterial] = useState<MaterialType>('hologram');
  const [objectColor, setObjectColor] = useState('#00f0ff');
  const [isWireframe, setIsWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    sceneRef.current = scene;

    // Grid helper
    const grid = new THREE.GridHelper(20, 20, 0x00f0ff, 0x1e293b);
    grid.position.y = -2;
    scene.add(grid);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 6);
    cameraRef.current = camera;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.0);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 1.5);
    dirLight2.position.set(-5, -5, -3);
    scene.add(dirLight2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Render loop
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);

      if (meshRef.current && autoRotate) {
        meshRef.current.rotation.y += 0.008;
        meshRef.current.rotation.x += 0.004;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Geometry & Material
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      if (Array.isArray(meshRef.current.material)) {
        meshRef.current.material.forEach((m) => m.dispose());
      } else {
        meshRef.current.material.dispose();
      }
    }

    let geometry: THREE.BufferGeometry;
    switch (activeShape) {
      case 'cube':
        geometry = new THREE.BoxGeometry(2, 2, 2);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(1.4, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(1, 1, 2.5, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(1.2, 0.45, 24, 48);
        break;
      case 'knot':
        geometry = new THREE.TorusKnotGeometry(1.0, 0.35, 100, 16);
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(1.5);
        break;
      default:
        geometry = new THREE.BoxGeometry(2, 2, 2);
    }

    let material: THREE.Material;
    const color = new THREE.Color(objectColor);

    switch (activeMaterial) {
      case 'hologram':
        material = new THREE.MeshPhysicalMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.35,
          roughness: 0.1,
          metalness: 0.1,
          transparent: true,
          opacity: 0.85,
          wireframe: isWireframe,
        });
        break;
      case 'wireframe':
        material = new THREE.MeshBasicMaterial({
          color,
          wireframe: true,
        });
        break;
      case 'chrome':
        material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          metalness: 0.95,
          roughness: 0.05,
          wireframe: isWireframe,
        });
        break;
      case 'neon':
        material = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.8,
          roughness: 0.4,
          wireframe: isWireframe,
        });
        break;
      default:
        material = new THREE.MeshStandardMaterial({ color });
    }

    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    scene.add(mesh);
  }, [activeShape, activeMaterial, objectColor, isWireframe]);

  // Hand gesture manipulation in 3D space
  useEffect(() => {
    if (activeHands.length === 0 || !meshRef.current) return;
    const primary = activeHands[0];

    // If hand rotated, rotate 3D mesh
    if (Math.abs(primary.rotationAngle) > 5) {
      meshRef.current.rotation.z = THREE.MathUtils.degToRad(primary.rotationAngle);
    }

    // Hand pinch moves mesh in X/Y 3D space
    if (primary.isPinching) {
      const normX = (primary.cursor.x / window.innerWidth) * 2 - 1;
      const normY = -(primary.cursor.y / window.innerHeight) * 2 + 1;
      meshRef.current.position.x = normX * 3;
      meshRef.current.position.y = normY * 2;
    }
  }, [activeHands]);

  // Snapshot 3D scene and place as vector/layer object on 2D canvas
  const handleProjectToCanvas = () => {
    soundEffects.playShapeRecognized();
    addElement({
      type: 'circle',
      x: 400,
      y: 300,
      width: 140,
      height: 140,
      radius: 70,
      fill: 'rgba(0, 240, 255, 0.15)',
      stroke: objectColor,
      strokeWidth: 3,
      rotation: 0,
      opacity: 0.9,
      glow: true,
      threeModelData: {
        shape: activeShape,
        material: activeMaterial,
        color: objectColor,
      },
    });
    setActiveMode('2d');
  };

  return (
    <div className="relative w-full h-full bg-[#060913] flex flex-col overflow-hidden">
      {/* 3D Top Controls Shelf */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between glass-panel-glow px-4 py-2.5 rounded-xl border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-sm font-bold tracking-wider text-cyan-300 font-cyber">
            SPATIAL 3D STUDIO (THREE.JS)
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Control: Rotate hand to turn • Pinch to translate
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              autoRotate ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            <RotateCw size={13} className={autoRotate ? 'animate-spin' : ''} />
            Auto-Rotate
          </button>

          <button
            onClick={handleProjectToCanvas}
            className="px-3.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Layers size={13} />
            Send to 2D Canvas
          </button>

          <button
            onClick={() => setActiveMode('2d')}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Back to Canvas
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Tool Inspector (Bottom-Left) */}
      <div className="absolute bottom-6 left-6 z-20 glass-panel-glow p-3.5 rounded-xl border border-cyan-500/30 flex flex-col gap-3 w-64">
        <div>
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 font-cyber">
            3D Primitive
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['cube', 'sphere', 'cylinder', 'torus', 'knot', 'dodecahedron'] as Shape3DType[]).map((shape) => (
              <button
                key={shape}
                onClick={() => {
                  soundEffects.playHover();
                  setActiveShape(shape);
                }}
                className={`py-1 px-1.5 text-[10px] rounded border font-mono uppercase tracking-tight transition-all capitalize cursor-pointer ${
                  activeShape === shape
                    ? 'bg-cyan-500 text-black font-bold border-cyan-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-cyan-500/50'
                }`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 font-cyber">
            Material
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['hologram', 'wireframe', 'chrome', 'neon'] as MaterialType[]).map((mat) => (
              <button
                key={mat}
                onClick={() => {
                  soundEffects.playHover();
                  setActiveMaterial(mat);
                }}
                className={`py-1 px-2 text-[11px] rounded border capitalize transition-all cursor-pointer ${
                  activeMaterial === mat
                    ? 'bg-indigo-600 text-white font-bold border-indigo-400'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-indigo-400/50'
                }`}
              >
                {mat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 font-cyber">
            Hologram Color
          </label>
          <div className="flex items-center gap-2">
            {['#00f0ff', '#a855f7', '#38bdf8', '#10b981', '#f59e0b', '#ec4899'].map((c) => (
              <button
                key={c}
                onClick={() => setObjectColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                  objectColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
