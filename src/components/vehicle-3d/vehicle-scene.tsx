"use client";

import { ContactShadows, Environment, Html, Lightformer, OrbitControls, useCursor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState, type ReactNode } from "react";
import { BackSide, CanvasTexture, Color, RepeatWrapping, SRGBColorSpace, type Mesh, type MeshPhysicalMaterial } from "three";
import type { PartVisual } from "@/domain/part-status";
import type { Severity } from "@prisma/client";
import type { MeshSpec, PartMeshSpec, VehicleModel } from "./model-provider";
import { OUTLINE_NOT_COVERED, SEVERITY_COLOR, VISUAL_COLOR, baseMaterial } from "./visual-style";

export type PartRenderState = { visual: PartVisual; severity?: Severity };

export type VehicleSceneProps = {
  model: VehicleModel;
  color: string;
  states: Record<string, PartRenderState>;
  activeKey: string | null;
  selectedKey: string | null;
  clickable: boolean;
  tooltip: ReactNode;
  onHover: (key: string | null) => void;
  onPartClick: (key: string) => void;
  onMissed: () => void;
};

function useHatchTexture() {
  return useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#d4d8de";
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = "#3f4651";
      ctx.lineWidth = 10;
      for (let i = -size; i < size * 2; i += 21) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + size, size);
        ctx.stroke();
      }
    }
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, []);
}

function DecorMesh({ spec, color }: { spec: MeshSpec; color: string }) {
  const m = baseMaterial(spec.material, color);
  return (
    <mesh geometry={spec.geometry} position={spec.position} rotation={spec.rotation} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={m.color}
        roughness={m.roughness}
        metalness={m.metalness}
        clearcoat={m.clearcoat ?? 0}
        transparent={m.opacity !== undefined}
        opacity={m.opacity ?? 1}
        emissive={m.emissive ?? "#000000"}
        emissiveIntensity={m.emissive ? 0.4 : 0}
      />
    </mesh>
  );
}

function PartMesh({
  spec,
  color,
  state,
  active,
  selected,
  clickable,
  hatch,
  onHover,
  onPartClick,
}: {
  spec: PartMeshSpec;
  color: string;
  state: PartRenderState;
  active: boolean;
  selected: boolean;
  clickable: boolean;
  hatch: CanvasTexture;
  onHover: (key: string | null) => void;
  onPartClick: (key: string) => void;
}) {
  const ref = useRef<Mesh>(null);
  const matRef = useRef<MeshPhysicalMaterial>(null);
  const [pointerOver, setPointerOver] = useState(false);
  useCursor(pointerOver, clickable ? "pointer" : "help", "auto");

  const base = baseMaterial(spec.material, color);
  const visual = state.visual;
  const stateColor =
    visual === "INTACTA"
      ? null
      : visual === "DANO"
        ? SEVERITY_COLOR[state.severity ?? "MEDIO"]
        : VISUAL_COLOR[visual];
  const notCovered = visual === "NAO_COBERTO";
  const displayColor = notCovered ? "#ffffff" : (stateColor ?? base.color);
  const highlight = useMemo(() => new Color(stateColor ?? "#ffffff"), [stateColor]);

  useFrame((_, delta) => {
    const mesh = ref.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    const targetScale = active ? 1.045 : 1;
    const k = 1 - Math.exp(-delta * 14);
    const s = mesh.scale.x + (targetScale - mesh.scale.x) * k;
    mesh.scale.setScalar(s);
    const targetEmissive = active ? 0.55 : base.emissive && visual === "INTACTA" ? 0.4 : stateColor ? 0.12 : 0;
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * k;
  });

  const emissive = active || stateColor ? highlight : new Color(base.emissive ?? "#000000");

  return (
    <mesh
      ref={ref}
      name={spec.key}
      geometry={spec.geometry}
      position={spec.position}
      rotation={spec.rotation}
      castShadow
      receiveShadow
      onPointerOver={(e) => {
        e.stopPropagation();
        setPointerOver(true);
        onHover(spec.key);
      }}
      onPointerOut={() => {
        setPointerOver(false);
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onPartClick(spec.key);
      }}
    >
      <meshPhysicalMaterial
        ref={matRef}
        color={displayColor}
        map={notCovered ? hatch : null}
        roughness={stateColor ? 0.45 : base.roughness}
        metalness={stateColor ? 0.15 : base.metalness}
        clearcoat={base.clearcoat ?? 0}
        transparent={base.opacity !== undefined && !stateColor}
        opacity={stateColor ? 1 : (base.opacity ?? 1)}
        emissive={emissive}
        emissiveIntensity={0}
      />
      {notCovered || selected ? (
        <mesh geometry={spec.geometry} scale={1.06} raycast={() => null}>
          <meshBasicMaterial color={notCovered ? OUTLINE_NOT_COVERED : "#ffffff"} side={BackSide} />
        </mesh>
      ) : null}
    </mesh>
  );
}

export default function VehicleScene(props: VehicleSceneProps) {
  const { model, color, states, activeKey, selectedKey, clickable, tooltip, onHover, onPartClick, onMissed } = props;
  const activeSpec = activeKey ? model.parts.find((p) => p.key === activeKey) : undefined;

  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      camera={{ position: model.camera.position, fov: 35, near: 0.1, far: 100 }}
      onPointerMissed={onMissed}
      gl={{ antialias: true, preserveDrawingBuffer: false }}
      aria-label="Modelo 3D do veículo"
    >
      <Suspense fallback={null}>
        <SceneContent
          model={model}
          color={color}
          states={states}
          activeKey={activeKey}
          selectedKey={selectedKey}
          clickable={clickable}
          onHover={onHover}
          onPartClick={onPartClick}
        />
        {activeSpec && tooltip ? (
          <Html
            position={[activeSpec.position[0], activeSpec.position[1] + 0.32, activeSpec.position[2]]}
            center
            zIndexRange={[15, 0]}
            style={{ pointerEvents: "none" }}
          >
            {tooltip}
          </Html>
        ) : null}
        <OrbitControls
          makeDefault
          target={model.camera.target}
          enablePan={false}
          enableDamping
          minDistance={model.camera.minDistance}
          maxDistance={model.camera.maxDistance}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 2 - 0.06}
        />
      </Suspense>
    </Canvas>
  );
}

function SceneContent({
  model,
  color,
  states,
  activeKey,
  selectedKey,
  clickable,
  onHover,
  onPartClick,
}: Omit<VehicleSceneProps, "tooltip" | "onMissed">) {
  const hatch = useHatchTexture();
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 7, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 3, -4]} intensity={0.5} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-6, 2, 1]} rotation={[0, Math.PI / 2, 0]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[6, 2, -1]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 2, 1]} />
        <Lightformer form="ring" intensity={0.8} position={[0, 1, 8]} scale={4} />
      </Environment>

      <group>
        {model.decor.map((d, i) => (
          <DecorMesh key={i} spec={d} color={color} />
        ))}
        {model.parts.map((p) => (
          <PartMesh
            key={p.key}
            spec={p}
            color={color}
            state={states[p.key] ?? { visual: "INTACTA" }}
            active={activeKey === p.key}
            selected={selectedKey === p.key}
            clickable={clickable}
            hatch={hatch}
            onHover={onHover}
            onPartClick={onPartClick}
          />
        ))}
      </group>

      <ContactShadows position={[0, 0.001, 0]} opacity={0.5} scale={12} blur={2.4} far={2.5} resolution={512} />
    </>
  );
}
