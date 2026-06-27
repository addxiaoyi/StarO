"use client";

import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./cubes.module.css";

type CellGap = number | {
  row?: number;
  col?: number;
};

type CubesDuration = {
  enter: number;
  leave: number;
};

type CubesProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  gridSize?: number;
  cubeSize?: number;
  maxAngle?: number;
  radius?: number;
  easing?: string;
  duration?: CubesDuration;
  cellGap?: CellGap;
  borderStyle?: string;
  faceColor?: string;
  shadow?: boolean | string;
  autoAnimate?: boolean;
  interactive?: boolean;
  rippleOnClick?: boolean;
  rippleColor?: string;
  rippleSpeed?: number;
};

type CubesStyle = CSSProperties & {
  "--cube-face-border": string;
  "--cube-face-bg": string;
  "--cube-face-shadow": string;
};

function gapValue(cellGap: CellGap | undefined, axis: "row" | "col") {
  if (typeof cellGap === "number") {
    return `${cellGap}px`;
  }

  const gap = cellGap?.[axis];
  return gap !== undefined ? `${gap}px` : "5%";
}

function faceClasses(...classNames: string[]) {
  return [styles.cubeFace, ...classNames].join(" ");
}

export function Cubes({
  gridSize = 10,
  cubeSize,
  maxAngle = 45,
  radius = 3,
  easing = "sine.out",
  duration = { enter: 0.22, leave: 0.32 },
  cellGap,
  borderStyle = "1px solid #fff",
  faceColor = "#120F17",
  shadow = false,
  autoAnimate = true,
  interactive = true,
  rippleOnClick = true,
  rippleColor = "#fff",
  rippleSpeed = 2,
  className,
  style,
  ...rest
}: CubesProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userActiveRef = useRef(false);
  const simPosRef = useRef({ x: 0, y: 0 });
  const simTargetRef = useRef({ x: 0, y: 0 });
  const simRafRef = useRef<number | null>(null);
  const reduceMotionRef = useRef(false);
  const isMobileRef = useRef(false);

  const enterDur = duration.enter;
  const leaveDur = duration.leave;

  const getCubes = useCallback(() => {
    const scene = sceneRef.current;
    return scene ? Array.from(scene.querySelectorAll<HTMLElement>(`.${styles.cube}`)) : [];
  }, []);

  const getFaces = useCallback((cube: HTMLElement) => Array.from(cube.querySelectorAll<HTMLElement>(`.${styles.cubeFace}`)), []);

  const resetAll = useCallback(() => {
    getCubes().forEach((cube) => {
      gsap.to(cube, {
        duration: leaveDur,
        rotationX: 0,
        rotationY: 0,
        ease: "sine.out",
        overwrite: true,
      });
    });
  }, [getCubes, leaveDur]);

  const tiltAt = useCallback(
    (rowCenter: number, colCenter: number) => {
      if (reduceMotionRef.current) {
        return;
      }

      getCubes().forEach((cube) => {
        const row = Number(cube.dataset.row);
        const col = Number(cube.dataset.col);
        const dist = Math.hypot(row - rowCenter, col - colCenter);

        if (dist <= radius) {
          const pct = 1 - dist / radius;
          const angle = pct * maxAngle;

          gsap.to(cube, {
            duration: enterDur,
            ease: easing,
            overwrite: true,
            rotationX: -angle,
            rotationY: angle,
          });
        } else {
          gsap.to(cube, {
            duration: leaveDur,
            ease: "sine.out",
            overwrite: true,
            rotationX: 0,
            rotationY: 0,
          });
        }
      });
    },
    [easing, enterDur, getCubes, leaveDur, maxAngle, radius],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const scene = sceneRef.current;
      if (!interactive || !scene || reduceMotionRef.current) {
        return;
      }

      userActiveRef.current = true;
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      const rect = scene.getBoundingClientRect();
      const cellW = rect.width / gridSize;
      const cellH = rect.height / gridSize;
      const colCenter = (event.clientX - rect.left) / cellW;
      const rowCenter = (event.clientY - rect.top) / cellH;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => tiltAt(rowCenter, colCenter));

      idleTimerRef.current = setTimeout(() => {
        userActiveRef.current = false;
      }, 3000);
    },
    [gridSize, interactive, tiltAt],
  );

  const onTouchMove = useCallback(
    (event: TouchEvent) => {
      const scene = sceneRef.current;
      const touch = event.touches[0];
      if (!interactive || !scene || !touch || reduceMotionRef.current) {
        return;
      }

      userActiveRef.current = true;
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      const rect = scene.getBoundingClientRect();
      const cellW = rect.width / gridSize;
      const cellH = rect.height / gridSize;
      const colCenter = (touch.clientX - rect.left) / cellW;
      const rowCenter = (touch.clientY - rect.top) / cellH;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => tiltAt(rowCenter, colCenter));

      idleTimerRef.current = setTimeout(() => {
        userActiveRef.current = false;
      }, 3000);
    },
    [gridSize, interactive, tiltAt],
  );

  const onTouchStart = useCallback(() => {
    if (!interactive) {
      return;
    }
    userActiveRef.current = true;
  }, [interactive]);

  const onTouchEnd = useCallback(() => {
    if (!interactive) {
      return;
    }
    resetAll();
  }, [interactive, resetAll]);

  const onClick = useCallback(
    (event: MouseEvent) => {
      const scene = sceneRef.current;
      if (!interactive || !rippleOnClick || !scene || reduceMotionRef.current) {
        return;
      }

      const rect = scene.getBoundingClientRect();
      const cellW = rect.width / gridSize;
      const cellH = rect.height / gridSize;
      const colHit = Math.floor((event.clientX - rect.left) / cellW);
      const rowHit = Math.floor((event.clientY - rect.top) / cellH);
      const spreadDelay = 0.15 / rippleSpeed;
      const animDuration = 0.3 / rippleSpeed;
      const holdTime = 0.6 / rippleSpeed;
      const rippleEase = "sine.out";
      const rings = new Map<number, HTMLElement[]>();

      getCubes().forEach((cube) => {
        const row = Number(cube.dataset.row);
        const col = Number(cube.dataset.col);
        const ring = Math.round(Math.hypot(row - rowHit, col - colHit));
        const ringCubes = rings.get(ring) || [];
        ringCubes.push(cube);
        rings.set(ring, ringCubes);
      });

      Array.from(rings.keys())
        .sort((a, b) => a - b)
        .forEach((ring) => {
          const delay = ring * spreadDelay;
          const faces = (rings.get(ring) || []).flatMap(getFaces);

          gsap.to(faces, {
            backgroundColor: rippleColor,
            duration: animDuration,
            delay,
            ease: rippleEase,
          });
          gsap.to(faces, {
            backgroundColor: faceColor,
            duration: animDuration,
            delay: delay + animDuration + holdTime,
            ease: rippleEase,
          });
        });
    },
    [faceColor, getCubes, getFaces, gridSize, interactive, rippleColor, rippleOnClick, rippleSpeed],
  );

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 1023px)");
    const syncMotionPreference = () => {
      reduceMotionRef.current = motionQuery.matches;
      isMobileRef.current = mobileQuery.matches;
      if (motionQuery.matches) {
        resetAll();
      }
    };

    syncMotionPreference();
    motionQuery.addEventListener("change", syncMotionPreference);
    mobileQuery.addEventListener("change", syncMotionPreference);

    return () => {
      motionQuery.removeEventListener("change", syncMotionPreference);
      mobileQuery.removeEventListener("change", syncMotionPreference);
    };
  }, [resetAll]);

  useEffect(() => {
    if (!autoAnimate || !interactive || !sceneRef.current || isMobileRef.current) {
      return;
    }

    simPosRef.current = {
      x: Math.random() * gridSize,
      y: Math.random() * gridSize,
    };
    simTargetRef.current = {
      x: Math.random() * gridSize,
      y: Math.random() * gridSize,
    };

    const speed = 0.02;
    const loop = () => {
      if (!reduceMotionRef.current && !userActiveRef.current) {
        const pos = simPosRef.current;
        const target = simTargetRef.current;

        pos.x += (target.x - pos.x) * speed;
        pos.y += (target.y - pos.y) * speed;
        tiltAt(pos.y, pos.x);

        if (Math.hypot(pos.x - target.x, pos.y - target.y) < 0.1) {
          simTargetRef.current = {
            x: Math.random() * gridSize,
            y: Math.random() * gridSize,
          };
        }
      }

      simRafRef.current = requestAnimationFrame(loop);
    };

    simRafRef.current = requestAnimationFrame(loop);

    return () => {
      if (simRafRef.current !== null) {
        cancelAnimationFrame(simRafRef.current);
      }
    };
  }, [autoAnimate, gridSize, interactive, tiltAt]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !interactive || isMobileRef.current) {
      return;
    }

    scene.addEventListener("pointermove", onPointerMove);
    scene.addEventListener("pointerleave", resetAll);
    scene.addEventListener("click", onClick);
    scene.addEventListener("touchmove", onTouchMove, { passive: true });
    scene.addEventListener("touchstart", onTouchStart, { passive: true });
    scene.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      scene.removeEventListener("pointermove", onPointerMove);
      scene.removeEventListener("pointerleave", resetAll);
      scene.removeEventListener("click", onClick);
      scene.removeEventListener("touchmove", onTouchMove);
      scene.removeEventListener("touchstart", onTouchStart);
      scene.removeEventListener("touchend", onTouchEnd);

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      gsap.killTweensOf(scene.querySelectorAll(`.${styles.cube}, .${styles.cubeFace}`));
    };
  }, [interactive, onClick, onPointerMove, onTouchEnd, onTouchMove, onTouchStart, resetAll]);

  const cells = Array.from({ length: gridSize });
  const sceneStyle: CSSProperties = {
    gridTemplateColumns: cubeSize ? `repeat(${gridSize}, ${cubeSize}px)` : `repeat(${gridSize}, 1fr)`,
    gridTemplateRows: cubeSize ? `repeat(${gridSize}, ${cubeSize}px)` : `repeat(${gridSize}, 1fr)`,
    columnGap: gapValue(cellGap, "col"),
    rowGap: gapValue(cellGap, "row"),
  };
  const wrapperStyle: CubesStyle = {
    "--cube-face-border": borderStyle,
    "--cube-face-bg": faceColor,
    "--cube-face-shadow": shadow === true ? "0 0 6px rgba(0,0,0,.5)" : shadow || "none",
    ...style,
    ...(cubeSize
      ? {
          width: `${gridSize * cubeSize}px`,
          height: `${gridSize * cubeSize}px`,
        }
      : {}),
  };

  return (
    <div className={[styles.defaultAnimation, className].filter(Boolean).join(" ")} style={wrapperStyle} {...rest}>
      <div ref={sceneRef} className={styles.scene} style={sceneStyle}>
        {cells.map((_, row) =>
          cells.map((__, col) => (
            <div key={`${row}-${col}`} className={styles.cube} data-row={row} data-col={col}>
              <div className={faceClasses(styles.cubeFaceTop)} />
              <div className={faceClasses(styles.cubeFaceBottom)} />
              <div className={faceClasses(styles.cubeFaceLeft)} />
              <div className={faceClasses(styles.cubeFaceRight)} />
              <div className={faceClasses(styles.cubeFaceFront)} />
              <div className={faceClasses(styles.cubeFaceBack)} />
            </div>
          )),
        )}
      </div>
    </div>
  );
}

export default Cubes;
