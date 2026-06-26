"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Point, StrokeDelta, StrokeEnd } from "@/lib/multiplayer/draw-types";

type IncomingStroke = {
  id: string;
  color: string;
  size: number;
  points: Point[];
  complete: boolean;
};

type DrawCanvasProps = {
  isDrawer: boolean;
  color: string;
  size: number;
  slot: number;
  onStrokeSegment: (seg: StrokeDelta) => void;
  onStrokeEnd: (end: StrokeEnd) => void;
  incomingStrokes: ReadonlyArray<IncomingStroke>;
  onClear: () => void;
  onUndo: () => void;
};

const FLUSH_MS = 60;
const MAX_PX = 600;

const makeStrokeId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function drawStroke(ctx: CanvasRenderingContext2D, pts: Point[], color: string, size: number, px: number): void {
  if (pts.length === 0) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x * px, pts[0].y * px, size / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0].x * px, pts[0].y * px);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * px, pts[i].y * px);
  ctx.stroke();
}

export function DrawCanvas({
  isDrawer,
  color,
  size,
  slot,
  onStrokeSegment,
  onStrokeEnd,
  incomingStrokes,
}: DrawCanvasProps): React.JSX.Element {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cssSize, setCssSize] = useState(0);

  const colorRef = useRef(color);
  const sizeRef = useRef(size);
  const slotRef = useRef(slot);
  colorRef.current = color;
  sizeRef.current = size;
  slotRef.current = slot;

  const strokeIdRef = useRef<string | null>(null);
  const segIndexRef = useRef(0);
  const bufferRef = useRef<Point[]>([]);
  const localPointsRef = useRef<Point[]>([]);
  const lastFlushRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver((entries) => {
      setCssSize(Math.min(Math.floor(entries[0].contentRect.width), MAX_PX));
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || cssSize === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    for (const s of incomingStrokes) drawStroke(ctx, s.points, s.color, s.size, cssSize);
    if (localPointsRef.current.length > 0) {
      drawStroke(ctx, localPointsRef.current, colorRef.current, sizeRef.current, cssSize);
    }
  }, [incomingStrokes, cssSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cssSize === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(cssSize * dpr);
    canvas.height = Math.floor(cssSize * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }, [cssSize, render]);

  useEffect(() => { render(); }, [render]);

  const flushBuffer = useCallback(() => {
    const buf = bufferRef.current;
    const id = strokeIdRef.current;
    if (!id || buf.length === 0) return;
    bufferRef.current = [];
    onStrokeSegment({
      strokeId: id,
      segIndex: segIndexRef.current++,
      points: buf,
      color: colorRef.current,
      size: sizeRef.current,
      slot: slotRef.current,
    });
  }, [onStrokeSegment]);

  const scheduleFlush = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const now = performance.now();
      if (now - lastFlushRef.current >= FLUSH_MS) {
        lastFlushRef.current = now;
        flushBuffer();
      } else if (bufferRef.current.length > 0) {
        // Self-reschedule onto the next frame to re-check the flush window.
        // eslint-disable-next-line react-hooks/immutability
        scheduleFlush();
      }
    });
  }, [flushBuffer]);

  const pointFromEvent = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point | null => {
    if (cssSize === 0) return null;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  }, [cssSize]);

  const endStroke = useCallback(() => {
    const id = strokeIdRef.current;
    if (!id) return;
    if (bufferRef.current.length > 0) flushBuffer();
    strokeIdRef.current = null;
    segIndexRef.current = 0;
    bufferRef.current = [];
    localPointsRef.current = [];
    pointerIdRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    onStrokeEnd({ strokeId: id, slot: slotRef.current });
    render();
  }, [flushBuffer, onStrokeEnd, render]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!isDrawer) return;
    const p = pointFromEvent(e);
    if (!p) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    strokeIdRef.current = makeStrokeId();
    segIndexRef.current = 0;
    bufferRef.current = [p];
    localPointsRef.current = [p];
    lastFlushRef.current = performance.now();
    render();
    scheduleFlush();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!isDrawer || strokeIdRef.current === null) return;
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
    const p = pointFromEvent(e);
    if (!p) return;
    bufferRef.current.push(p);
    localPointsRef.current.push(p);
    render();
    scheduleFlush();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!isDrawer || strokeIdRef.current === null) return;
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    endStroke();
  };

  return (
    <div ref={wrapRef} className="w-full max-w-[600px] mx-auto">
      <canvas
        ref={canvasRef}
        className="block w-full rounded-2xl border border-border bg-white"
        style={{
          touchAction: "none",
          width: cssSize > 0 ? `${cssSize}px` : "100%",
          height: cssSize > 0 ? `${cssSize}px` : "auto",
          aspectRatio: "1 / 1",
          cursor: isDrawer ? "crosshair" : "default",
        }}
        onPointerDown={isDrawer ? onPointerDown : undefined}
        onPointerMove={isDrawer ? onPointerMove : undefined}
        onPointerUp={isDrawer ? onPointerUp : undefined}
        onPointerLeave={isDrawer ? onPointerUp : undefined}
        onPointerCancel={isDrawer ? onPointerUp : undefined}
      />
    </div>
  );
}
