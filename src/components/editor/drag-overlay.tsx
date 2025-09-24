import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { TextStyle, TranscriptWord, useClipEditorStore } from "@/stores/clip-editor-store";
import { CLIP_CONFIG } from "@/lib/constants";

const EDITABLE_TARGETS = ["hook", "captions"] as const;
type EditableTarget = (typeof EDITABLE_TARGETS)[number];

interface DragOverlayProps {
  transcript: TranscriptWord[];
  hook: string;
  hookStyle: TextStyle;
  captionsStyle: TextStyle;
}

type ElementMetrics = {
  widthPercent: number;
  heightPercent: number;
};

type ElementMetricsMap = Partial<Record<EditableTarget, ElementMetrics>>;

interface EditableBoxProps {
  target: EditableTarget;
  text: string;
  style: TextStyle;
  isSelected: boolean;
  onDragStart: (target: EditableTarget, event: React.PointerEvent<HTMLDivElement>) => void;
  onResizeStart: (
    target: EditableTarget,
    handle: "top-left" | "top-right" | "bottom-left" | "bottom-right",
    event: React.PointerEvent<HTMLDivElement>
  ) => void;
  metrics?: ElementMetrics;
}

const EditableBox: React.FC<EditableBoxProps> = ({
  target,
  text,
  style,
  isSelected,
  onDragStart,
  onResizeStart,
  metrics,
}) => {
  if (!text.trim() || !metrics) {
    return null;
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDragStart(target, event);
  };

  const handleResizePointerDown = (
    handle: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  ) => (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onResizeStart(target, handle, event);
  };

  const boxStyles: React.CSSProperties = {
    position: "absolute",
    left: `${style.position.x}%`,
    top: `${style.position.y}%`,
    transform: "translate(-50%, -50%)",
    width: `${metrics.widthPercent}%`,
    height: `${metrics.heightPercent}%`,
    borderRadius: "12px",
    pointerEvents: "auto",
    touchAction: "none",
    display: "block",
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    boxSizing: "border-box",
  };

  const borderStyles = isSelected
    ? "border-sky-400 shadow-[0_0_0_1px_rgba(56,189,248,0.9)]"
    : "border-sky-300/70 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]";

  return (
    <div
      data-overlay-element={target}
      onPointerDown={handlePointerDown}
      style={boxStyles}
      className="editable-overlay-box relative cursor-move"
    >
      <div className={`absolute inset-0 rounded-xl border ${borderStyles} pointer-events-none`} />

      {/* Resize handles */}
      <div
        className="absolute -top-3 -left-3 h-4 w-4 rounded-full border border-white/60 bg-sky-500/90 cursor-nwse-resize"
        onPointerDown={handleResizePointerDown("top-left")}
      />
      <div
        className="absolute -top-3 -right-3 h-4 w-4 rounded-full border border-white/60 bg-sky-500/90 cursor-nesw-resize"
        onPointerDown={handleResizePointerDown("top-right")}
      />
      <div
        className="absolute -bottom-3 -left-3 h-4 w-4 rounded-full border border-white/60 bg-sky-500/90 cursor-nesw-resize"
        onPointerDown={handleResizePointerDown("bottom-left")}
      />
      <div
        className="absolute -bottom-3 -right-3 h-4 w-4 rounded-full border border-white/60 bg-sky-500/90 cursor-nwse-resize"
        onPointerDown={handleResizePointerDown("bottom-right")}
      />
    </div>
  );
};

export default function DragOverlay({
  transcript,
  hook,
  hookStyle,
  captionsStyle,
}: DragOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const startDrag = useClipEditorStore((state) => state.startDrag);
  const updateDrag = useClipEditorStore((state) => state.updateDrag);
  const endDrag = useClipEditorStore((state) => state.endDrag);
  const startResize = useClipEditorStore((state) => state.startResize);
  const updateResize = useClipEditorStore((state) => state.updateResize);
  const endResize = useClipEditorStore((state) => state.endResize);
  const dragState = useClipEditorStore((state) => state.dragState);
  const selectedTextElement = useClipEditorStore((state) => state.selectedTextElement);
  const getActiveWords = useClipEditorStore((state) => state.getActiveWords);
  const updateHookStyle = useClipEditorStore((state) => state.updateHookStyle);
  const updateCaptionsStyle = useClipEditorStore((state) => state.updateCaptionsStyle);

  const [elementMetrics, setElementMetrics] = useState<ElementMetricsMap>({});
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const updateMetrics = useCallback(() => {
    const overlayElement = overlayRef.current;
    if (!overlayElement) return;

    const containerRect = overlayElement.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) {
      return;
    }

    const parent = overlayElement.parentElement;
    if (!parent) return;

    const measure = (target: EditableTarget) => {
      const parentElement = parent.querySelector<HTMLElement>(`[data-editor-element="${target}"]`);
      if (!parentElement) return undefined;

      const measureTarget = parentElement.querySelector<HTMLElement>('[data-measure-target]');
      const elementToMeasure = measureTarget ?? parentElement;

      const rect = elementToMeasure.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return undefined;
      }
      const widthPercent = (rect.width / containerRect.width) * 100;
      const cappedWidth = Math.min(
        widthPercent,
        CLIP_CONFIG.POSITION_BOUNDS.MAX - CLIP_CONFIG.POSITION_BOUNDS.MIN
      );

      return {
        widthPercent: cappedWidth,
        heightPercent: (rect.height / containerRect.height) * 100,
      } satisfies ElementMetrics;
    };

    setElementMetrics((prev) => {
      let changed = false;
      const next: ElementMetricsMap = { ...prev };

      EDITABLE_TARGETS.forEach((target) => {
        const metrics = measure(target);
        if (!metrics) {
          if (prev[target]) {
            delete next[target];
            changed = true;
          }
          return;
        }

        const previous = prev[target];
        if (
          !previous ||
          Math.abs(previous.widthPercent - metrics.widthPercent) > 0.1 ||
          Math.abs(previous.heightPercent - metrics.heightPercent) > 0.1
        ) {
          next[target] = metrics;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, []);

  useLayoutEffect(() => {
    if (!isReady) return;
    updateMetrics();

    const overlayElement = overlayRef.current;
    if (!overlayElement || typeof ResizeObserver === "undefined") {
      return;
    }

    const parent = overlayElement.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(() => updateMetrics());
    observer.observe(parent);

    EDITABLE_TARGETS.forEach((target) => {
      const element = parent.querySelector(`[data-editor-element="${target}"]`);
      if (element instanceof HTMLElement) {
        observer.observe(element);
        const measureTarget = element.querySelector('[data-measure-target]');
        if (measureTarget) {
          observer.observe(measureTarget);
        }
      }
    });

    return () => observer.disconnect();
  }, [updateMetrics, hook, hookStyle.fontSize, captionsStyle.fontSize, transcript, isReady]);

  const clampPositionWithinBounds = useCallback(
    (pointer: { x: number; y: number }) => {
      const { dragTarget, dragOffset } = dragState;
      if (!dragTarget) return pointer;

      const size = elementMetrics[dragTarget];
      if (!size) {
        return pointer;
      }

      const halfWidth = size.widthPercent / 2;
      const halfHeight = size.heightPercent / 2;

      const minX = CLIP_CONFIG.POSITION_BOUNDS.MIN + halfWidth;
      const maxX = CLIP_CONFIG.POSITION_BOUNDS.MAX - halfWidth;
      const minY = CLIP_CONFIG.POSITION_BOUNDS.MIN + halfHeight;
      const maxY = CLIP_CONFIG.POSITION_BOUNDS.MAX - halfHeight;

      const effectiveMinX = Math.min(minX, maxX);
      const effectiveMaxX = Math.max(minX, maxX);
      const effectiveMinY = Math.min(minY, maxY);
      const effectiveMaxY = Math.max(minY, maxY);

      const clamp = (value: number, min: number, max: number) =>
        Math.max(min, Math.min(max, value));

      const midPoint = (CLIP_CONFIG.POSITION_BOUNDS.MIN + CLIP_CONFIG.POSITION_BOUNDS.MAX) / 2;

      const minPointerX = effectiveMinX + dragOffset.x;
      const maxPointerX = effectiveMaxX + dragOffset.x;
      const minPointerY = effectiveMinY + dragOffset.y;
      const maxPointerY = effectiveMaxY + dragOffset.y;

      return {
        x:
          effectiveMinX === effectiveMaxX
            ? midPoint
            : clamp(pointer.x, minPointerX, maxPointerX),
        y:
          effectiveMinY === effectiveMaxY
            ? midPoint
            : clamp(pointer.y, minPointerY, maxPointerY),
      };
    },
    [dragState, elementMetrics]
  );

  useLayoutEffect(() => {
    const adjustPosition = (
      target: EditableTarget,
      style: TextStyle,
      bounds?: ElementMetrics
    ) => {
      if (!bounds) return;

      const halfWidth = bounds.widthPercent / 2;
      const halfHeight = bounds.heightPercent / 2;
      const minX = CLIP_CONFIG.POSITION_BOUNDS.MIN + halfWidth;
      const maxX = CLIP_CONFIG.POSITION_BOUNDS.MAX - halfWidth;
      const minY = CLIP_CONFIG.POSITION_BOUNDS.MIN + halfHeight;
      const maxY = CLIP_CONFIG.POSITION_BOUNDS.MAX - halfHeight;

      const effectiveMinX = Math.min(minX, maxX);
      const effectiveMaxX = Math.max(minX, maxX);
      const effectiveMinY = Math.min(minY, maxY);
      const effectiveMaxY = Math.max(minY, maxY);

      const clamp = (value: number, min: number, max: number) =>
        Math.max(min, Math.min(max, value));

      const midPoint = (CLIP_CONFIG.POSITION_BOUNDS.MIN + CLIP_CONFIG.POSITION_BOUNDS.MAX) / 2;

      const clampedX =
        effectiveMinX === effectiveMaxX
          ? midPoint
          : clamp(style.position.x, effectiveMinX, effectiveMaxX);
      const clampedY =
        effectiveMinY === effectiveMaxY
          ? midPoint
          : clamp(style.position.y, effectiveMinY, effectiveMaxY);

      if (clampedX !== style.position.x || clampedY !== style.position.y) {
        const update = target === "hook" ? updateHookStyle : updateCaptionsStyle;
        update({
          position: {
            x: clampedX,
            y: clampedY,
          },
        });
      }
    };

    adjustPosition("hook", hookStyle, elementMetrics.hook);
    adjustPosition("captions", captionsStyle, elementMetrics.captions);
  }, [elementMetrics, hookStyle, captionsStyle, updateHookStyle, updateCaptionsStyle]);

  const activeWords = getActiveWords();
  const fallbackPreview = transcript.slice(0, 3).map((word) => word.word).join(" ");
  const captionsPreviewText = activeWords.length
    ? activeWords.map((word) => word.word).join(" ")
    : fallbackPreview;

  const getRelativePointerPosition = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const current = overlayRef.current;
    if (!current) return null;
    const rect = current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    return { x, y } as const;
  }, []);

  const handleDragStart = useCallback(
    (target: EditableTarget, event: React.PointerEvent<HTMLDivElement>) => {
      if (dragState.isDragging || dragState.isResizing) return;
      const pointer = getRelativePointerPosition(event);
      if (!pointer) return;
      const clampedPointer = clampPositionWithinBounds(pointer);
      const referenceStyle = target === "hook" ? hookStyle : captionsStyle;
      const offsetX = clampedPointer.x - referenceStyle.position.x;
      const offsetY = clampedPointer.y - referenceStyle.position.y;

      overlayRef.current?.setPointerCapture(event.pointerId);
      startDrag(target, { x: offsetX, y: offsetY });
    },
    [captionsStyle, clampPositionWithinBounds, dragState.isDragging, dragState.isResizing, getRelativePointerPosition, hookStyle, startDrag]
  );

  const handleResizeStart = useCallback(
    (
      target: EditableTarget,
      handle: "top-left" | "top-right" | "bottom-left" | "bottom-right",
      event: React.PointerEvent<HTMLDivElement>
    ) => {
      if (dragState.isDragging || dragState.isResizing) return;
      const pointer = getRelativePointerPosition(event);
      if (!pointer) return;

      overlayRef.current?.setPointerCapture(event.pointerId);
      startResize(target, handle, pointer);
    },
    [dragState.isDragging, dragState.isResizing, getRelativePointerPosition, startResize]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragState.isDragging && !dragState.isResizing) return;
      const pointer = getRelativePointerPosition(event);
      if (!pointer) return;

      if (dragState.isDragging) {
        const adjustedPointer = clampPositionWithinBounds(pointer);
        updateDrag(adjustedPointer);
        return;
      }

      if (dragState.isResizing && dragState.initialResizeData) {
        const { textPosition, handlePosition, fontSize } = dragState.initialResizeData;
        const initialDistance = Math.hypot(
          handlePosition.x - textPosition.x,
          handlePosition.y - textPosition.y
        );
        const newDistance = Math.hypot(pointer.x - textPosition.x, pointer.y - textPosition.y);

        if (initialDistance === 0) {
          return;
        }

        const scale = newDistance / initialDistance;
        const nextFontSize = fontSize * scale;
        updateResize(nextFontSize);
      }
    },
    [dragState, getRelativePointerPosition, updateDrag, updateResize, clampPositionWithinBounds]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (overlayRef.current?.hasPointerCapture(event.pointerId)) {
        overlayRef.current.releasePointerCapture(event.pointerId);
      }
      if (dragState.isDragging) {
        endDrag();
      }
      if (dragState.isResizing) {
        endResize();
      }
    },
    [dragState.isDragging, dragState.isResizing, endDrag, endResize]
  );

    return (
        <div
        ref={overlayRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="absolute inset-0 pointer-events-none"
    >
      <EditableBox
        target="hook"
        text={hook}
        style={hookStyle}
        isSelected={selectedTextElement === "hook"}
        onDragStart={handleDragStart}
        onResizeStart={handleResizeStart}
        metrics={elementMetrics.hook}
      />
      <EditableBox
        target="captions"
        text={captionsPreviewText}
        style={captionsStyle}
        isSelected={selectedTextElement === "captions"}
        onDragStart={handleDragStart}
        onResizeStart={handleResizeStart}
        metrics={elementMetrics.captions}
      />
        </div>
  );
}