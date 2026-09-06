import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OrbitFollowCameraProps {
  targetRef: React.MutableRefObject<THREE.Vector3>;
  followHeight?: number;
  followDistance?: number;
  enabled?: boolean;
  azimuthRef?: React.MutableRefObject<number>;
}

/**
 * A camera that follows a target position but allows the user to orbit around it
 * by dragging with the mouse (desktop) or touching and dragging (mobile/tablets).
 * The camera always looks at the target. Vertical angle is clamped so you can
 * look up at the sky but not flip upside down.
 */
export default function OrbitFollowCamera({
  targetRef,
  followHeight = 5,
  followDistance = 9,
  enabled = true,
  azimuthRef,
}: OrbitFollowCameraProps) {
  const { camera, gl } = useThree();

  // Spherical coordinates: azimuth (horizontal angle), polar (vertical angle)
  // azimuth = 0 places camera at +Z (same side as original camera at z=18),
  // so W (dz -= speed) moves player away from camera = forward on screen
  const azimuth = useRef(0);
  const polar = useRef(Math.PI / 3.2); // slightly above horizontal
  const targetAzimuth = useRef(0);
  const targetPolar = useRef(Math.PI / 3.2);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const touchId = useRef<number | null>(null);
  const zoomRef = useRef(followDistance);
  const tempVec = useRef(new THREE.Vector3());

  // Auto-rotate back to default when not dragging
  const autoRotate = useRef(true);
  const autoRotateTimer = useRef<number | null>(null);

  const handlePointerDown = useCallback((clientX: number, clientY: number, id?: number) => {
    isDragging.current = true;
    autoRotate.current = false;
    lastX.current = clientX;
    lastY.current = clientY;
    if (id !== undefined) touchId.current = id;
    if (autoRotateTimer.current) { clearTimeout(autoRotateTimer.current); autoRotateTimer.current = null; }
  }, []);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const dx = clientX - lastX.current;
    const dy = clientY - lastY.current;
    lastX.current = clientX;
    lastY.current = clientY;
    // Adjust sensitivity
    targetAzimuth.current -= dx * 0.006;
    targetPolar.current -= dy * 0.005;
    // Clamp polar angle: 0.15 (nearly top-down looking down) to 1.45 (looking up at sky)
    targetPolar.current = Math.max(0.15, Math.min(1.45, targetPolar.current));
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    touchId.current = null;
    // After 3 seconds of no interaction, slowly auto-rotate back to default
    if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
    autoRotateTimer.current = window.setTimeout(() => { autoRotate.current = true; }, 4000);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dom = gl.domElement;

    // Mouse handlers
    const onMouseDown = (e: MouseEvent) => {
      // Only respond to left button
      if (e.button !== 0) return;
      handlePointerDown(e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerUp();

    // Touch handlers
    const onTouchStart = (e: TouchEvent) => {
      // Only use the first touch for camera (joystick handles its own touches)
      // Check if the touch started on the joystick area (bottom-left)
      const t = e.changedTouches[0];
      const target = e.target as HTMLElement;
      // Skip if touching a button, joystick, or UI element
      if (target.closest('button') || target.closest('[data-joystick]') || target.closest('[data-ui]')) return;
      // Skip touches in bottom-left quadrant (joystick zone)
      if (t.clientX < window.innerWidth * 0.35 && t.clientY > window.innerHeight * 0.5) return;
      handlePointerDown(t.clientX, t.clientY, t.identifier);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchId.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchId.current) {
          handlePointerMove(t.clientX, t.clientY);
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId.current) {
          handlePointerUp();
        }
      }
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    dom.addEventListener('touchcancel', onTouchEnd, { passive: true });

    // Wheel zoom — use ref so the value persists across frames
    const onWheel = (e: WheelEvent) => {
      zoomRef.current = Math.max(4, Math.min(20, zoomRef.current + e.deltaY * 0.01));
    };
    dom.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('touchcancel', onTouchEnd);
      dom.removeEventListener('wheel', onWheel);
      if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
    };
  }, [gl, enabled, handlePointerDown, handlePointerMove, handlePointerUp]);

  useFrame(() => {
    if (!enabled) return;
    const target = targetRef.current;

    // Smooth interpolation
    azimuth.current += (targetAzimuth.current - azimuth.current) * 0.1;
    polar.current += (targetPolar.current - polar.current) * 0.1;

    // Auto-rotate back to default when idle
    if (autoRotate.current && !isDragging.current) {
      targetAzimuth.current += (0 - targetAzimuth.current) * 0.005;
      targetPolar.current += (Math.PI / 3.2 - targetPolar.current) * 0.005;
    }

    // Share the current azimuth with external consumers (e.g. movement controls)
    if (azimuthRef) azimuthRef.current = azimuth.current;

    // Compute camera position from spherical coordinates
    const r = zoomRef.current;
    const x = target.x + r * Math.sin(polar.current) * Math.sin(azimuth.current);
    const y = target.y + r * Math.cos(polar.current) + followHeight * 0.5;
    const z = target.z + r * Math.sin(polar.current) * Math.cos(azimuth.current);

    // Reuse a temp vector to avoid per-frame allocation
    tempVec.current.set(x, y, z);
    camera.position.lerp(tempVec.current, 0.08);
    camera.lookAt(target.x, 1.5, target.z);
  });

  return null;
}
