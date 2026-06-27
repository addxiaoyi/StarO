"use client";

import { memo, useEffect, useId, useRef, type ComponentPropsWithoutRef } from "react";
import styles from "./dot-field.module.css";

const TWO_PI = Math.PI * 2;

type DotFieldProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
  interactive?: boolean;
  maxFps?: number;
};

type Dot = {
  ax: number;
  ay: number;
  sx: number;
  sy: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

type MouseState = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  speed: number;
};

type SizeState = {
  w: number;
  h: number;
  offsetX: number;
  offsetY: number;
};

type DotFieldRuntimeProps = Required<
  Pick<
    DotFieldProps,
    | "dotRadius"
    | "dotSpacing"
    | "cursorRadius"
    | "cursorForce"
    | "bulgeOnly"
    | "bulgeStrength"
    | "sparkle"
    | "waveAmplitude"
    | "gradientFrom"
    | "gradientTo"
    | "interactive"
    | "maxFps"
  >
>;

export const DotField = memo(function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(168, 85, 247, 0.35)",
  gradientTo = "rgba(180, 151, 207, 0.25)",
  glowColor = "#120F17",
  interactive = true,
  maxFps = 60,
  className,
  ...rest
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef<MouseState>({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 });
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef<SizeState>({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const glowOpacityRef = useRef(0);
  const engagementRef = useRef(0);
  const reduceMotionRef = useRef(false);
  const rebuildRef = useRef<(() => void) | null>(null);
  const glowId = `dot-field-glow-${useId().replaceAll(":", "")}`;
  const propsRef = useRef<DotFieldRuntimeProps>({
    dotRadius,
    dotSpacing,
    cursorRadius,
    cursorForce,
    bulgeOnly,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom,
    gradientTo,
    interactive,
    maxFps,
  });

  propsRef.current = {
    dotRadius,
    dotSpacing,
    cursorRadius,
    cursorForce,
    bulgeOnly,
    bulgeStrength,
    sparkle,
    waveAmplitude,
    gradientFrom,
    gradientTo,
    interactive,
    maxFps,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const glowEl = glowRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !parent || !ctx) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    let frameCount = 0;
    let lastFrameTime = 0;
    const hasVisibleMotion = () => {
      const props = propsRef.current;
      return props.interactive || props.sparkle || props.waveAmplitude > 0;
    };

    const buildDots = (w: number, h: number) => {
      const props = propsRef.current;
      const step = props.dotRadius + props.dotSpacing;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const dots = new Array<Dot>(rows * cols);
      let index = 0;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step + step / 2;
          const ay = padY + row * step + step / 2;
          dots[index++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
        }
      }

      dotsRef.current = dots;
    };

    const drawDots = () => {
      const dots = dotsRef.current;
      const { w, h } = sizeRef.current;
      const props = propsRef.current;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      const radius = props.dotRadius / 2;

      ctx.clearRect(0, 0, w, h);
      grad.addColorStop(0, props.gradientFrom);
      grad.addColorStop(1, props.gradientTo);
      ctx.fillStyle = grad;
      ctx.beginPath();

      dots.forEach((dot) => {
        ctx.moveTo(dot.sx + radius, dot.sy);
        ctx.arc(dot.sx, dot.sy, radius, 0, TWO_PI);
      });

      ctx.fill();
    };

    const doResize = () => {
      const rect = parent.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      sizeRef.current = {
        w,
        h,
        offsetX: rect.left + window.scrollX,
        offsetY: rect.top + window.scrollY,
      };

      buildDots(w, h);
      drawDots();
    };

    const resize = () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(doResize, 100);
    };

    const onMouseMove = (event: MouseEvent) => {
      const size = sizeRef.current;
      mouseRef.current.x = event.pageX - size.offsetX;
      mouseRef.current.y = event.pageY - size.offsetY;
    };

    const updateMouseSpeed = () => {
      const mouse = mouseRef.current;
      const dx = mouse.prevX - mouse.x;
      const dy = mouse.prevY - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      mouse.speed += (dist - mouse.speed) * 0.5;
      if (mouse.speed < 0.001) {
        mouse.speed = 0;
      }
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
    };

    const tick = () => {
      const props = propsRef.current;
      if (reduceMotionRef.current || !hasVisibleMotion()) {
        drawDots();
        rafRef.current = null;
        return;
      }

      const fpsInterval = 1000 / Math.max(1, props.maxFps);
      const now = performance.now();
      if (now - lastFrameTime < fpsInterval) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastFrameTime = now;

      frameCount++;
      const dots = dotsRef.current;
      const mouse = mouseRef.current;
      const { w, h } = sizeRef.current;
      const time = frameCount * 0.02;
      const targetEngagement = props.interactive ? Math.min(mouse.speed / 5, 1) : 0;

      engagementRef.current += (targetEngagement - engagementRef.current) * 0.06;
      if (engagementRef.current < 0.001) {
        engagementRef.current = 0;
      }
      const engagement = engagementRef.current;
      glowOpacityRef.current += (engagement - glowOpacityRef.current) * 0.08;

      if (glowEl) {
        glowEl.setAttribute("cx", String(mouse.x));
        glowEl.setAttribute("cy", String(mouse.y));
        glowEl.style.opacity = String(glowOpacityRef.current);
      }

      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, props.gradientFrom);
      grad.addColorStop(1, props.gradientTo);
      ctx.fillStyle = grad;

      const cursorRadiusSq = props.cursorRadius * props.cursorRadius;
      const radius = props.dotRadius / 2;
      ctx.beginPath();

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dx = mouse.x - dot.ax;
        const dy = mouse.y - dot.ay;
        const distSq = dx * dx + dy * dy;

        if (distSq < cursorRadiusSq && engagement > 0.01) {
          const dist = Math.sqrt(distSq);
          const angle = Math.atan2(dy, dx);

          if (props.bulgeOnly) {
            const t = 1 - dist / props.cursorRadius;
            const push = t * t * props.bulgeStrength * engagement;
            dot.sx += (dot.ax - Math.cos(angle) * push - dot.sx) * 0.15;
            dot.sy += (dot.ay - Math.sin(angle) * push - dot.sy) * 0.15;
          } else {
            const move = (500 / Math.max(dist, 1)) * (mouse.speed * props.cursorForce);
            dot.vx += Math.cos(angle) * -move;
            dot.vy += Math.sin(angle) * -move;
          }
        } else if (props.bulgeOnly) {
          dot.sx += (dot.ax - dot.sx) * 0.1;
          dot.sy += (dot.ay - dot.sy) * 0.1;
        }

        if (!props.bulgeOnly) {
          dot.vx *= 0.9;
          dot.vy *= 0.9;
          dot.x = dot.ax + dot.vx;
          dot.y = dot.ay + dot.vy;
          dot.sx += (dot.x - dot.sx) * 0.1;
          dot.sy += (dot.y - dot.sy) * 0.1;
        }

        let drawX = dot.sx;
        let drawY = dot.sy;
        if (props.waveAmplitude > 0) {
          drawY += Math.sin(dot.ax * 0.03 + time) * props.waveAmplitude;
          drawX += Math.cos(dot.ay * 0.03 + time * 0.7) * props.waveAmplitude * 0.5;
        }

        if (props.sparkle) {
          const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
          const sparkRadius = hash % 100 < 3 ? radius * 1.8 : radius;
          ctx.moveTo(drawX + sparkRadius, drawY);
          ctx.arc(drawX, drawY, sparkRadius, 0, TWO_PI);
        } else {
          ctx.moveTo(drawX + radius, drawY);
          ctx.arc(drawX, drawY, radius, 0, TWO_PI);
        }
      }

      ctx.fill();
      rafRef.current = requestAnimationFrame(tick);
    };

    const syncMotionPreference = () => {
      reduceMotionRef.current = motionQuery.matches;
      if ((motionQuery.matches || !hasVisibleMotion()) && rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        drawDots();
      } else if (!motionQuery.matches && hasVisibleMotion() && rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    doResize();
    reduceMotionRef.current = motionQuery.matches;
    const speedInterval = propsRef.current.interactive ? window.setInterval(updateMouseSpeed, 40) : undefined;
    window.addEventListener("resize", resize);
    if (propsRef.current.interactive) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
    }
    motionQuery.addEventListener("change", syncMotionPreference);
    if (!reduceMotionRef.current && hasVisibleMotion()) {
      rafRef.current = requestAnimationFrame(tick);
    }

    rebuildRef.current = () => {
      const { w, h } = sizeRef.current;
      if (w > 0 && h > 0) {
        buildDots(w, h);
        drawDots();
      }
    };

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (speedInterval !== undefined) {
        clearInterval(speedInterval);
      }
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      motionQuery.removeEventListener("change", syncMotionPreference);
      rebuildRef.current = null;
    };
  }, [interactive]);

  useEffect(() => {
    rebuildRef.current?.();
  }, [dotRadius, dotSpacing]);

  return (
    <div className={[styles.container, className].filter(Boolean).join(" ")} {...rest}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <svg className={styles.glow} aria-hidden="true">
        <defs>
          <radialGradient id={glowId}>
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle ref={glowRef} cx="-9999" cy="-9999" r={glowRadius} fill={`url(#${glowId})`} style={{ opacity: 0, willChange: "opacity" }} />
      </svg>
    </div>
  );
});

DotField.displayName = "DotField";

export default DotField;
