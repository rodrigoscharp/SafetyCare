"use client";

import { CameraControls, ContactShadows, Environment, Html, Lightformer, MeshReflectorMaterial, useCursor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO } from "@react-three/postprocessing";
import CameraControlsImpl from "camera-controls";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BackSide, CanvasTexture, Color, PerspectiveCamera, RepeatWrapping, SRGBColorSpace, type Mesh, type MeshPhysicalMaterial } from "three";
import type { PartVisual } from "@/domain/part-status";
import type { Severity } from "@prisma/client";
import type { MeshSpec, PartMeshSpec, VehicleModel } from "./model-provider";
import { OUTLINE_NOT_COVERED, SEVERITY_COLOR, VISUAL_COLOR, baseMaterial } from "./visual-style";

export type PartRenderState = { visual: PartVisual; severity?: Severity };

export type Vec3 = [number, number, number];
export type CameraRequest = { position: Vec3; nonce: number };

export type VehicleSceneProps = {
  model: VehicleModel;
  cameraPosition: Vec3;
  /** Pedido de movimento de câmera (vistas prontas); muda o nonce para repetir */
  cameraRequest: CameraRequest | null;
  autoRotate: boolean;
  /** Rolagem do mouse e toque de um dedo controlam a câmera (senão rolam a página) */
  engaged: boolean;
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
        clearcoatRoughness={m.clearcoatRoughness ?? 0.1}
        envMapIntensity={1.35}
        transparent={m.opacity !== undefined}
        opacity={m.opacity ?? 1}
        emissive={m.emissive ?? "#000000"}
        emissiveIntensity={m.emissive ? (m.glow ?? 0.4) : 0}
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
    const targetEmissive = active ? 0.55 : base.emissive && visual === "INTACTA" ? (base.glow ?? 0.4) : stateColor ? 0.12 : 0;
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
        clearcoatRoughness={base.clearcoatRoughness ?? 0.1}
        envMapIntensity={1.35}
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
  const { model, cameraPosition, cameraRequest, autoRotate, engaged, color, states, activeKey, selectedKey, clickable, tooltip, onHover, onPartClick, onMissed } = props;
  const activeSpec = activeKey ? model.parts.find((p) => p.key === activeKey) : undefined;

  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      camera={{ position: cameraPosition, fov: 35, near: 0.1, far: 100 }}
      onPointerMissed={onMissed}
      gl={{ antialias: true, preserveDrawingBuffer: false, toneMappingExposure: 1.05 }}
      style={{ touchAction: engaged ? "none" : "pan-y" }}
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
        <ResponsiveFov />
        <Effects />
        <CameraRig model={model} request={cameraRequest} autoRotate={autoRotate} engaged={engaged} />
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
}: Omit<VehicleSceneProps, "tooltip" | "onMissed" | "cameraPosition" | "cameraRequest" | "autoRotate" | "engaged">) {
  const hatch = useHatchTexture();
  return (
    <>
      <hemisphereLight args={["#ffffff", "#3a4256", 0.35]} />
      <directionalLight
        position={[4, 8, 3]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[-6, 3, -5]} intensity={0.45} color="#c9d4ff" />
      {/* Estúdio: softbox no teto + faixas de luz que desenham reflexos na lataria */}
      <Environment resolution={512} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[14, 7, 1]} />
        <Lightformer form="rect" intensity={5} position={[0, 2.6, -7]} scale={[20, 0.35, 1]} />
        <Lightformer form="rect" intensity={5} position={[0, 1.6, 7]} rotation={[0, Math.PI, 0]} scale={[20, 0.3, 1]} />
        <Lightformer form="rect" intensity={3} position={[-8, 2.2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[14, 0.5, 1]} />
        <Lightformer form="rect" intensity={3} position={[8, 2.2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[14, 0.5, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[14, 14, 1]} color="#5a6170" />
        <Lightformer form="ring" intensity={2} position={[6, 4, 6]} scale={3} />
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

      <mesh rotation-x={-Math.PI / 2} position={[0, -0.002, 0]} receiveShadow>
        <circleGeometry args={[model.camera.maxDistance * 0.45, 96]} />
        {/* piso de estúdio: reflexo borrado do veículo, mistura com o fundo da página */}
        <MeshReflectorMaterial
          color="#7d8598"
          transparent
          opacity={0.35}
          blur={[400, 120]}
          resolution={512}
          mixBlur={1}
          mixStrength={1.6}
          mixContrast={1}
          roughness={0.9}
          metalness={0.2}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          mirror={0.6}
        />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.65} scale={12} blur={2.2} far={2} resolution={1024} />
      <ContactShadows position={[0, 0.002, 0]} opacity={0.55} scale={7} blur={0.6} far={0.6} resolution={512} />
    </>
  );
}

function CameraRig({ model, request, autoRotate, engaged }: { model: VehicleModel; request: CameraRequest | null; autoRotate: boolean; engaged: boolean }) {
  const ref = useRef<CameraControls>(null);
  const [tx, ty, tz] = model.camera.target;

  useEffect(() => {
    ref.current?.setTarget(tx, ty, tz, false);
  }, [tx, ty, tz]);

  useEffect(() => {
    if (!request || !ref.current) return;
    const [x, y, z] = request.position;
    void ref.current.setLookAt(x, y, z, tx, ty, tz, true);
  }, [request, tx, ty, tz]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const A = CameraControlsImpl.ACTION;
    c.mouseButtons.wheel = engaged ? A.DOLLY : A.NONE;
    c.mouseButtons.right = A.NONE;
    c.touches.one = engaged ? A.TOUCH_ROTATE : A.NONE;
    c.touches.two = A.TOUCH_DOLLY_ROTATE;
  }, [engaged]);

  useFrame((_, delta) => {
    if (autoRotate && ref.current) ref.current.azimuthAngle += delta * 0.35;
  });

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={model.camera.minDistance}
      maxDistance={model.camera.maxDistance}
      minPolarAngle={0.02}
      maxPolarAngle={Math.PI / 2 - 0.06}
      truckSpeed={0}
      smoothTime={0.35}
      dollySpeed={0.6}
    />
  );
}

const BASE_FOV = 35;
/** Aspecto a partir do qual o enquadramento horizontal é preservado (palco "em pé" no celular). */
const MIN_ASPECT = 1.25;

/** Em telas estreitas, abre o FOV vertical para manter a largura do veículo visível. */
function ResponsiveFov() {
  const camera = useThree((s) => s.camera);
  const { width, height } = useThree((s) => s.size);
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera) || !height) return;
    const aspect = width / height;
    const half = (BASE_FOV * Math.PI) / 360;
    camera.fov = aspect >= MIN_ASPECT ? BASE_FOV : (2 * Math.atan((Math.tan(half) * MIN_ASPECT) / aspect) * 180) / Math.PI;
    camera.updateProjectionMatrix();
  }, [camera, width, height]);
  return null;
}

/**
 * Pós-processamento: oclusão de ambiente (sombras de contato nos cantos e frestas)
 * e bloom só no que brilha acima de 1 (faróis, LED, lanternas). Desligado em palcos pequenos
 * (celular), onde o custo não compensa.
 */
function Effects() {
  const width = useThree((s) => s.size.width);
  if (width < 560) return null;
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <N8AO aoRadius={0.45} distanceFalloff={0.6} intensity={2.4} quality="medium" halfRes />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.15} intensity={0.85} radius={0.6} />
    </EffectComposer>
  );
}
