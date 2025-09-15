"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useClipEditorStore, TranscriptWord } from "@/stores/clip-editor-store";

interface VideoPreviewProps {
  videoUrl: string;
  className?: string;
  // Props for display-only mode (project page)
  displayOnly?: boolean;
  clip?: {
    transcript?: any;
    hook?: string | null;
    hookStyle?: { fontSize: number; position: { x: number; y: number } };
    captionsStyle?: { fontSize: number; position: { x: number; y: number } };
    captionStylePreference?: number;
  };
}

export function VideoPreview({ videoUrl, className = "", displayOnly = false, clip }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(null);

  // Local state for display-only mode
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [localDuration, setLocalDuration] = useState(0);

  // Use store in editor mode, local state in display mode
  const storeData = useClipEditorStore();
  
  const {
    currentTime,
    hook,
    isEditMode,
    hookStyle,
    captionsStyle,
    selectedTextElement,
    dragState,
    captionStylePreference,
    setCurrentTime,
    setIsPlaying,
    setDuration,
    setSelectedTextElement,
    startDrag,
    updateDrag,
    endDrag,
    startResize,
    updateResize,
    endResize,
    getActiveWords,
  } = displayOnly ? {
    // Display-only mode: use local state and clip data
    currentTime: localCurrentTime,
    hook: clip?.hook || '',
    isEditMode: false,
    hookStyle: clip?.hookStyle || { fontSize: 24, position: { x: 50, y: 15 } },
    captionsStyle: clip?.captionsStyle || { fontSize: 32, position: { x: 50, y: 80 } },
    selectedTextElement: null,
    dragState: { isDragging: false, isResizing: false, dragTarget: null, dragOffset: { x: 0, y: 0 }, resizeHandle: null },
    captionStylePreference: clip?.captionStylePreference ?? 0, // Default style for display mode
    setCurrentTime: setLocalCurrentTime,
    setIsPlaying: setLocalIsPlaying,
    setDuration: setLocalDuration,
    setSelectedTextElement: () => {},
    startDrag: () => {},
    updateDrag: () => {},
    endDrag: () => {},
    startResize: () => {},
    updateResize: () => {},
    endResize: () => {},
    getActiveWords: () => {
      // Enhanced implementation matching the store's logic for display mode
      if (!clip?.transcript || !Array.isArray(clip.transcript)) return [];
      
      const transcript = clip.transcript;
      if (transcript.length === 0) return [];
      
      let currentWordIndex = -1;
      
      // First, try to find a word that is currently active
      for (let i = 0; i < transcript.length; i++) {
        if (localCurrentTime >= transcript[i].start && localCurrentTime <= transcript[i].end) {
          currentWordIndex = i;
          break;
        }
      }
      
      // If no word is exactly active, find the closest upcoming word
      if (currentWordIndex === -1) {
        for (let i = 0; i < transcript.length; i++) {
          if (localCurrentTime < transcript[i].start) {
            currentWordIndex = i;
            break;
          }
        }
      }
      
      // If still no word found, find the last word that has passed
      if (currentWordIndex === -1) {
        for (let i = transcript.length - 1; i >= 0; i--) {
          if (localCurrentTime >= transcript[i].start) {
            currentWordIndex = i;
            break;
          }
        }
      }
      
      // If we found a current word, determine which group of 3 it belongs to
      if (currentWordIndex >= 0) {
        // Calculate which group of 3 this word belongs to
        const groupIndex = Math.floor(currentWordIndex / 3);
        const startIndex = groupIndex * 3;
        const endIndex = Math.min(transcript.length - 1, startIndex + 2);
        
        return transcript.slice(startIndex, endIndex + 1);
      }
      
      return [];
    },
  } : storeData;

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, [setDuration]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, [setIsPlaying]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  // Get canvas coordinates from mouse/touch event
  const getCanvasCoords = useCallback(
    (event: MouseEvent | React.Touch, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      return { x, y };
    },
    []
  );

  // Centralized text layout calculation for both rendering and hit detection.
  // This ensures that the visual representation and the clickable areas are always in sync.
  const calculateTextLayout = useCallback(
    (textElement: "hook" | "captions", canvas: HTMLCanvasElement) => {
      const style = textElement === "hook" ? hookStyle : captionsStyle;
      const text = textElement === "hook" ? hook : getActiveWords();

      if (
        (typeof text === "string" && !text.trim()) ||
        (Array.isArray(text) && text.length === 0)
      ) {
        return null;
      }

      const rect = canvas.getBoundingClientRect();
      const baseCanvasHeight = 600;
      const scaleFactor = Math.max(
        0.4,
        Math.min(2.5, rect.height / baseCanvasHeight)
      );
      const responsiveFontSize = Math.round(style.fontSize * scaleFactor);

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const isHook = textElement === "hook";
      const font = `bold ${responsiveFontSize}px ${
        !isHook && captionStylePreference === 1 ? "Anton" : "Impact"
      }, Arial, sans-serif`;
      ctx.font = font;

      const maxWidth = rect.width * 0.9;
      const lines: (string | TranscriptWord[])[] = [];

      if (isHook && typeof text === "string") {
        const hookLines = text.split("\n");
        hookLines.forEach((line) => {
          if (line.trim() === "") {
            lines.push("");
            return;
          }
          const words = line.split(" ");
          let currentLine = "";
          for (const word of words) {
            const testLine = currentLine + (currentLine ? " " : "") + word;
            if (
              ctx.measureText(testLine).width <= maxWidth ||
              currentLine === ""
            ) {
              currentLine = testLine;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          if (currentLine) {
            lines.push(currentLine);
          }
        });
      } else if (!isHook && Array.isArray(text) && text.length > 0) {
        let currentLine: TranscriptWord[] = [];
        text.forEach((word) => {
          const testLine = [...currentLine, word].map((w) => w.word).join(" ");
          const measureText =
            captionStylePreference === 3 ? testLine.toUpperCase() : testLine;
          if (
            ctx.measureText(measureText).width > maxWidth &&
            currentLine.length > 0
          ) {
            lines.push(currentLine);
            currentLine = [word];
          } else {
            currentLine.push(word);
          }
        });
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
      }

      if (lines.length === 0) return null;

      const getLineText = (line: string | TranscriptWord[]) => {
        if (typeof line === "string") return line;
        return line.map((w) => w.word).join(" ");
      };

      const maxLineWidth = Math.max(
        ...lines
          .map(getLineText)
          .filter((l) => l.trim())
          .map((line) =>
            ctx.measureText(
              captionStylePreference === 3 && !isHook
                ? line.toUpperCase()
                : line
            ).width
          )
      );

      const lineHeight = responsiveFontSize * 1.2;
      const totalHeight = lines.length * lineHeight;
      const textBaseline = responsiveFontSize * 0.8;

      return {
        lines,
        responsiveFontSize,
        lineHeight,
        totalHeight,
        maxLineWidth,
        textBaseline,
        font,
      };
    },
    [hook, getActiveWords, hookStyle, captionsStyle, captionStylePreference]
  );

  // Get text bounds for hit testing (handles multi-line text)
  const getTextBounds = useCallback(
    (textElement: "hook" | "captions", canvas: HTMLCanvasElement) => {
      const layout = calculateTextLayout(textElement, canvas);
      if (!layout) return null;

      const style = textElement === "hook" ? hookStyle : captionsStyle;
      const { maxLineWidth, totalHeight, textBaseline } = layout;
      const rect = canvas.getBoundingClientRect();
      const padding = 12;

      const textX = (style.position.x / 100) * rect.width;
      const textY = (style.position.y / 100) * rect.height;

      const startY = textY - totalHeight / 2;
      const rectTop = startY - textBaseline - padding;

      const left = ((textX - maxLineWidth / 2 - padding) / rect.width) * 100;
      const right =
        ((textX + maxLineWidth / 2 + padding) / rect.width) * 100;
      const top = (rectTop / rect.height) * 100;
      const bottom =
        ((rectTop + totalHeight + padding * 2) / rect.height) * 100;

      return { left, right, top, bottom };
    },
    [calculateTextLayout, hookStyle, captionsStyle]
  );

  // Check if coordinates are within resize handle and return which handle
  const getResizeHandle = useCallback(
    (
      coords: { x: number; y: number },
      textElement: "hook" | "captions",
      canvas: HTMLCanvasElement
    ): "top-left" | "top-right" | "bottom-left" | "bottom-right" | null => {
      const layout = calculateTextLayout(textElement, canvas);
      if (!layout) return null;

      const style = textElement === "hook" ? hookStyle : captionsStyle;
      const { maxLineWidth, totalHeight, textBaseline, responsiveFontSize } =
        layout;

      const rect = canvas.getBoundingClientRect();
      const handleSize = 12;
      const padding = 12;
      const textX = (style.position.x / 100) * rect.width;
      const textY = (style.position.y / 100) * rect.height;
      const lineHeight = responsiveFontSize * 1.2; // Standard line spacing
      const startY = textY - totalHeight / 2;

      // Calculate handle positions (same as visual rectangle)
      const rectTop = startY - textBaseline - padding;
      const rectHeight = totalHeight + padding * 2;
      const rectLeft = textX - maxLineWidth / 2 - padding;
      const rectRight = textX + maxLineWidth / 2 + padding;
      const rectBottom = rectTop + rectHeight;

      const coordsInPixels = {
        x: (coords.x / 100) * rect.width,
        y: (coords.y / 100) * rect.height,
      };

      // Check all four corners
      const handles = [
        { x: rectLeft, y: rectTop, type: "top-left" as const },
        { x: rectRight, y: rectTop, type: "top-right" as const },
        { x: rectLeft, y: rectBottom, type: "bottom-left" as const },
        { x: rectRight, y: rectBottom, type: "bottom-right" as const },
      ];

      for (const handle of handles) {
        if (
          coordsInPixels.x >= handle.x - handleSize / 2 &&
          coordsInPixels.x <= handle.x + handleSize / 2 &&
          coordsInPixels.y >= handle.y - handleSize / 2 &&
          coordsInPixels.y <= handle.y + handleSize / 2
        ) {
          return handle.type;
        }
      }

      return null;
    },
    [hookStyle, captionsStyle, hook, getActiveWords]
  );

  // Canvas mouse/touch event handlers
  const handleCanvasMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || dragState.isDragging || dragState.isResizing) return;

      const coords = getCanvasCoords(event.nativeEvent, canvas);

      // Check for resize handle clicks first (they take priority)
      if (selectedTextElement === "hook") {
        const handle = getResizeHandle(coords, "hook", canvas);
        if (handle) {
          startResize("hook", handle, coords);
          return;
        }
      }

      if (selectedTextElement === "captions") {
        const handle = getResizeHandle(coords, "captions", canvas);
        if (handle) {
          startResize("captions", handle, coords);
          return;
        }
      }

      // Check if click/touch is on hook text
      if (hook.trim()) {
        const hookBounds = getTextBounds(
          "hook",
          canvas
        );
        if (
          hookBounds &&
          coords.x >= hookBounds.left &&
          coords.x <= hookBounds.right &&
          coords.y >= hookBounds.top &&
          coords.y <= hookBounds.bottom
        ) {
          setSelectedTextElement("hook");
          const offset = {
            x: coords.x - hookStyle.position.x,
            y: coords.y - hookStyle.position.y,
          };
          startDrag("hook", offset);
          return;
        }
      }

      // Check if click/touch is on captions text
      const activeWords = getActiveWords();
      if (activeWords.length > 0) {
        const captionText = activeWords.map((w) => w.word).join(" ");
        const captionBounds = getTextBounds(
          "captions",
          canvas
        );
        if (
          captionBounds &&
          coords.x >= captionBounds.left &&
          coords.x <= captionBounds.right &&
          coords.y >= captionBounds.top &&
          coords.y <= captionBounds.bottom
        ) {
          setSelectedTextElement("captions");
          const offset = {
            x: coords.x - captionsStyle.position.x,
            y: coords.y - captionsStyle.position.y,
          };
          startDrag("captions", offset);
          return;
        }
      }

      // If no text was clicked, clear selection
      setSelectedTextElement(null);
    },
    [
      hook,
      hookStyle,
      captionsStyle,
      dragState,
      selectedTextElement,
      getCanvasCoords,
      getTextBounds,
      getResizeHandle,
      startDrag,
      startResize,
      setSelectedTextElement,
      getActiveWords,
    ]
  );

  // Get cursor type based on hover position
  const getCursorType = useCallback(
    (coords: { x: number; y: number }, canvas: HTMLCanvasElement) => {
      // Check for resize handle hover
      if (selectedTextElement === "hook") {
        const handle = getResizeHandle(coords, "hook", canvas);
        if (handle) {
          return handle === "top-left" || handle === "bottom-right"
            ? "nwse-resize"
            : "nesw-resize";
        }
      }
      if (selectedTextElement === "captions") {
        const handle = getResizeHandle(coords, "captions", canvas);
        if (handle) {
          return handle === "top-left" || handle === "bottom-right"
            ? "nwse-resize"
            : "nesw-resize";
        }
      }

      // Check for text hover
      if (hook.trim()) {
        const hookBounds = getTextBounds("hook", canvas);
        if (
          hookBounds &&
          coords.x >= hookBounds.left &&
          coords.x <= hookBounds.right &&
          coords.y >= hookBounds.top &&
          coords.y <= hookBounds.bottom
        ) {
          return "grab";
        }
      }

      const activeWords = getActiveWords();
      if (activeWords.length > 0) {
        const captionBounds = getTextBounds("captions", canvas);
        if (
          captionBounds &&
          coords.x >= captionBounds.left &&
          coords.x <= captionBounds.right &&
          coords.y >= captionBounds.top &&
          coords.y <= captionBounds.bottom
        ) {
          return "grab";
        }
      }

      return "default";
    },
    [
      selectedTextElement,
      getResizeHandle,
      hook,
      getActiveWords,
      getTextBounds,
    ]
  );

  const handleCanvasMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const coords = getCanvasCoords(event.nativeEvent, canvas);

      if (dragState.isDragging) {
        // Handle dragging
        const newPosition = {
          x: coords.x - dragState.dragOffset.x,
          y: coords.y - dragState.dragOffset.y,
        };
        updateDrag(newPosition);
      } else if (dragState.isResizing && dragState.dragTarget && dragState.initialResizeData) {
        // Handle resizing - calculate new font size based on distance from initial handle position
        const initialData = dragState.initialResizeData;
        
        // Calculate distance from initial handle position to current mouse position
        const currentDistance = Math.sqrt(
          Math.pow(coords.x - initialData.handlePosition.x, 2) +
            Math.pow(coords.y - initialData.handlePosition.y, 2)
        );
        
        // Calculate distance from initial handle position to text center
        const initialDistanceToCenter = Math.sqrt(
          Math.pow(initialData.handlePosition.x - initialData.textPosition.x, 2) +
            Math.pow(initialData.handlePosition.y - initialData.textPosition.y, 2)
        );
        
        // Calculate current distance from mouse to text center
        const currentDistanceToCenter = Math.sqrt(
          Math.pow(coords.x - initialData.textPosition.x, 2) +
            Math.pow(coords.y - initialData.textPosition.y, 2)
        );
        
        // Determine scaling factor: if current distance to center is greater than initial, grow text
        // If current distance to center is smaller than initial, shrink text
        const scaleFactor = currentDistanceToCenter / initialDistanceToCenter;
        
        // Apply scaling to initial font size with sensitivity adjustment
        const newFontSize = Math.max(
          12, // FONT_SIZE_BOUNDS.MIN
          Math.min(
            80, // FONT_SIZE_BOUNDS.MAX
            initialData.fontSize * Math.pow(scaleFactor, 0.8) // Power < 1 for more gentle scaling
          )
        );

        updateResize(newFontSize);
      } else {
        // Update cursor based on hover position
        const cursorType = getCursorType(coords, canvas);
        canvas.style.cursor = cursorType;
      }
    },
    [
      dragState,
      hookStyle,
      captionsStyle,
      getCanvasCoords,
      updateDrag,
      updateResize,
      getCursorType,
    ]
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      endDrag();
    }
    if (dragState.isResizing) {
      endResize();
    }
  }, [dragState, endDrag, endResize]);

  // Touch event handlers
  const handleCanvasTouchStart = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const touch = event.touches[0];
      const canvas = canvasRef.current;
      if (!canvas || dragState.isDragging || dragState.isResizing) return;

      const coords = getCanvasCoords(touch, canvas);

      // Check for resize handle clicks first (they take priority)
      if (selectedTextElement === "hook") {
        const handle = getResizeHandle(coords, "hook", canvas);
        if (handle) {
          startResize("hook", handle, coords);
          return;
        }
      }

      if (selectedTextElement === "captions") {
        const handle = getResizeHandle(coords, "captions", canvas);
        if (handle) {
          startResize("captions", handle, coords);
          return;
        }
      }

      // Check if touch is on hook text
      if (hook.trim()) {
        const hookBounds = getTextBounds(
          "hook",
          canvas
        );
        if (
          hookBounds &&
          coords.x >= hookBounds.left &&
          coords.x <= hookBounds.right &&
          coords.y >= hookBounds.top &&
          coords.y <= hookBounds.bottom
        ) {
          setSelectedTextElement("hook");
          const offset = {
            x: coords.x - hookStyle.position.x,
            y: coords.y - hookStyle.position.y,
          };
          startDrag("hook", offset);
          return;
        }
      }

      // Check if touch is on captions text
      const activeWords = getActiveWords();
      if (activeWords.length > 0) {
        const captionText = activeWords.map((w) => w.word).join(" ");
        const captionBounds = getTextBounds(
          "captions",
          canvas
        );
        if (
          captionBounds &&
          coords.x >= captionBounds.left &&
          coords.x <= captionBounds.right &&
          coords.y >= captionBounds.top &&
          coords.y <= captionBounds.bottom
        ) {
          setSelectedTextElement("captions");
          const offset = {
            x: coords.x - captionsStyle.position.x,
            y: coords.y - captionsStyle.position.y,
          };
          startDrag("captions", offset);
          return;
        }
      }

      // If no text was touched, clear selection
      setSelectedTextElement(null);
    },
    [
      hook,
      hookStyle,
      captionsStyle,
      dragState,
      selectedTextElement,
      getCanvasCoords,
      getTextBounds,
      getResizeHandle,
      startDrag,
      startResize,
      setSelectedTextElement,
      getActiveWords,
    ]
  );

  const handleCanvasTouchMove = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const touch = event.touches[0];
      const canvas = canvasRef.current;
      if (!canvas || (!dragState.isDragging && !dragState.isResizing)) return;

      const coords = getCanvasCoords(touch, canvas);

      if (dragState.isDragging) {
        // Handle dragging
        const newPosition = {
          x: coords.x - dragState.dragOffset.x,
          y: coords.y - dragState.dragOffset.y,
        };
        updateDrag(newPosition);
      } else if (dragState.isResizing && dragState.dragTarget && dragState.initialResizeData) {
        // Handle resizing - same logic as mouse for consistency
        const initialData = dragState.initialResizeData;
        
        const currentDistanceToCenter = Math.sqrt(
          Math.pow(coords.x - initialData.textPosition.x, 2) +
            Math.pow(coords.y - initialData.textPosition.y, 2)
        );
        
        const initialDistanceToCenter = Math.sqrt(
          Math.pow(initialData.handlePosition.x - initialData.textPosition.x, 2) +
            Math.pow(initialData.handlePosition.y - initialData.textPosition.y, 2)
        );
        
        const scaleFactor = currentDistanceToCenter / initialDistanceToCenter;
        
        const newFontSize = Math.max(
          12,
          Math.min(
            80,
            initialData.fontSize * Math.pow(scaleFactor, 0.8)
          )
        );

        updateResize(newFontSize);
      }
    },
    [
      dragState,
      hookStyle,
      captionsStyle,
      getCanvasCoords,
      updateDrag,
      updateResize,
    ]
  );

  const handleCanvasTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      if (dragState.isDragging) {
        endDrag();
      }
      if (dragState.isResizing) {
        endResize();
      }
    },
    [dragState, endDrag, endResize]
  );

  // Canvas drawing function
  const drawSubtitles = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match video display size, accounting for device pixel ratio for sharpness
    const rect = video.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Calculate responsive font sizes based on canvas dimensions
    // Base scale factor: use canvas height as reference (mobile-first approach)
    const baseCanvasHeight = 600; // Reference height for default font sizes
    const scaleFactor = Math.max(0.4, Math.min(2.5, rect.height / baseCanvasHeight)); // More aggressive scaling
    
    // Apply responsive scaling to font sizes
    const responsiveHookFontSize = Math.round(hookStyle.fontSize * scaleFactor);
    const responsiveCaptionsFontSize = Math.round(captionsStyle.fontSize * scaleFactor);

    // Draw hook (always visible at top)
    const hookLayout = calculateTextLayout("hook", canvas);
    if (hookLayout) {
      const {
        lines,
        responsiveFontSize,
        lineHeight,
        totalHeight,
        maxLineWidth,
        textBaseline,
        font,
      } = hookLayout;

      ctx.font = font;
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle =
        selectedTextElement === "hook" && !displayOnly ? "#00FF00" : "#000000";
      ctx.lineWidth = Math.max(2, Math.round(responsiveFontSize * 0.02)); // Thinner, responsive outline
      ctx.textAlign = "center";

      // Add shadow effect matching captions
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 0;

      // Calculate position from percentage
      const hookX = (hookStyle.position.x / 100) * rect.width;
      const hookY = (hookStyle.position.y / 100) * rect.height;

      // Draw each line of the hook with proper spacing
      const startY = hookY - totalHeight / 2;

      (lines as string[]).forEach((line, index) => {
        const y = startY + index * lineHeight;
        if (line.trim()) {
          // Only draw non-empty lines
          ctx.strokeText(line.toUpperCase(), hookX, y);
          ctx.fillText(line.toUpperCase(), hookX, y);
        }
      });

      // Clear shadow for other elements
      ctx.shadowColor = "transparent";

      // Draw selection indicator for hook (only in edit mode)
      if (selectedTextElement === "hook" && !displayOnly) {
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        const padding = 12;

        // Calculate proper text bounds (accounting for text baseline)
        const rectTop = startY - textBaseline - padding;
        const rectHeight = totalHeight + padding * 2;

        // Single rectangle around entire text block
        ctx.strokeRect(
          hookX - maxLineWidth / 2 - padding,
          rectTop,
          maxLineWidth + padding * 2,
          rectHeight
        );

        ctx.setLineDash([]); // Reset line dash

        // Draw resize handles at all four corners
        const handleSize = 12;
        const rectLeft = hookX - maxLineWidth / 2 - padding;
        const rectRight = hookX + maxLineWidth / 2 + padding;
        const rectBottom = rectTop + rectHeight;

        const handles = [
          { x: rectLeft, y: rectTop, cursor: "nw-resize" }, // top-left
          { x: rectRight, y: rectTop, cursor: "ne-resize" }, // top-right
          { x: rectLeft, y: rectBottom, cursor: "sw-resize" }, // bottom-left
          { x: rectRight, y: rectBottom, cursor: "se-resize" }, // bottom-right
        ];

        handles.forEach((handle) => {
          // Handle background (white circle)
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(handle.x, handle.y, handleSize / 2, 0, Math.PI * 2);
          ctx.fill();

          // Handle border (green circle)
          ctx.strokeStyle = "#00FF00";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(handle.x, handle.y, handleSize / 2, 0, Math.PI * 2);
          ctx.stroke();

          // Resize arrows icon
          ctx.strokeStyle = "#00FF00";
          ctx.lineWidth = 1.5;
          const arrowSize = 2.5;
          ctx.beginPath();
          // Diagonal arrows based on corner
          if (handle.cursor === "nw-resize" || handle.cursor === "se-resize") {
            // ↖↘ arrows
            ctx.moveTo(handle.x - arrowSize, handle.y - arrowSize);
            ctx.lineTo(handle.x + arrowSize, handle.y + arrowSize);
            ctx.moveTo(handle.x - arrowSize + 1, handle.y - arrowSize);
            ctx.lineTo(handle.x - arrowSize, handle.y - arrowSize + 1);
            ctx.moveTo(handle.x + arrowSize - 1, handle.y + arrowSize);
            ctx.lineTo(handle.x + arrowSize, handle.y + arrowSize - 1);
          } else {
            // ↗↙ arrows
            ctx.moveTo(handle.x - arrowSize, handle.y + arrowSize);
            ctx.lineTo(handle.x + arrowSize, handle.y - arrowSize);
            ctx.moveTo(handle.x - arrowSize, handle.y + arrowSize - 1);
            ctx.lineTo(handle.x - arrowSize + 1, handle.y + arrowSize);
            ctx.moveTo(handle.x + arrowSize, handle.y - arrowSize + 1);
            ctx.lineTo(handle.x + arrowSize - 1, handle.y - arrowSize);
          }
          ctx.stroke();
        });
      }
    }

    // Draw active words (captions)
    const activeWords = getActiveWords();
    // Use the video's precise currentTime for smooth per-frame animation
    const renderTime = video.currentTime;
    const captionsLayout = calculateTextLayout("captions", canvas);
    if (captionsLayout) {
      const {
        lines,
        responsiveFontSize,
        lineHeight,
        totalHeight,
        maxLineWidth,
        textBaseline,
      } = captionsLayout;

      const captionsX = (captionsStyle.position.x / 100) * rect.width;
      const captionsY = (captionsStyle.position.y / 100) * rect.height;
      const startY = captionsY - totalHeight / 2;
      
      // --- 2. Style-Specific Rendering ---
      (lines as TranscriptWord[][]).forEach((lineOfWords, i) => {
        const lineText = lineOfWords.map((w) => w.word).join(" ");
        const yPos =
          startY + i * lineHeight + responsiveFontSize / 2; // Adjust for text baseline

        // Style 1: Red highlight with Anton font (matching backend styling)
        if (captionStylePreference === 1) {
          ctx.font = `bold ${responsiveFontSize}px Anton, sans-serif`;
          ctx.lineWidth = Math.max(
            2,
            Math.round(responsiveFontSize * 0.02)
          ); // Thinner outline
          ctx.strokeStyle = "#000000";

          // Add shadow effect matching backend
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; // shadowcolor with 50% opacity
          ctx.shadowOffsetX = 1; // Softer shadow offset
          ctx.shadowOffsetY = 1; // Softer shadow offset
          ctx.shadowBlur = 0; // Sharp shadow like backend

          const totalLineWidth = ctx.measureText(lineText).width;
          let currentX = captionsX - totalLineWidth / 2;
          ctx.textAlign = "left";

          lineOfWords.forEach((word) => {
            const isCurrentWord =
              currentTime >= word.start && currentTime <= word.end;
            ctx.fillStyle = isCurrentWord ? "#FF0000" : "#FFFFFF"; // primarycolor: white, with red highlight

            const wordText = word.word;

            ctx.strokeText(wordText, currentX, yPos);
            ctx.fillText(wordText, currentX, yPos);

            currentX += ctx.measureText(wordText + " ").width;
          });

          // Clear shadow for other elements
          ctx.shadowColor = "transparent";
          ctx.textAlign = "center"; // Reset alignment
        } else if (captionStylePreference === 3) {
          // Style 3: Karaoke (Impact, uppercase). Base orange; progress turns white smoothly
          ctx.font = `bold ${responsiveFontSize}px Impact, Arial, sans-serif`;
          // Slightly increased outline for readability, still thinner than default style
          ctx.lineWidth = Math.max(
            1.8,
            responsiveFontSize * 0.022
          );
          ctx.strokeStyle = "#000000";

          // Add subtle shadow like default style
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          ctx.shadowBlur = 0;

          const lineTextUpper = lineText.toUpperCase();
          const totalLineWidth = ctx.measureText(lineTextUpper).width;
          let currentX = captionsX - totalLineWidth / 2;
          ctx.textAlign = "left";

          lineOfWords.forEach((word) => {
            const wordText = word.word.toUpperCase();
            const wordWidth = ctx.measureText(wordText).width;
            const spaceWidth = ctx.measureText(" ").width;

            // Outline first so it doesn't visually shrink the fill
            ctx.strokeText(wordText, currentX, yPos);

            // Base: draw full word in orange
            ctx.fillStyle = "#FFA500"; // orange
            ctx.fillText(wordText, currentX, yPos);

            // Progress: compute smooth ratio within the word
            let progress = 0;
            if (renderTime >= word.end) progress = 1;
            else if (renderTime > word.start) {
              const duration = Math.max(0.001, word.end - word.start);
              progress = Math.min(1, Math.max(0, (renderTime - word.start) / duration));
            }

            if (progress > 0) {
              ctx.save();
              ctx.beginPath();
              // Clip a rectangle covering the completed portion of the word (left -> right)
              ctx.rect(currentX, yPos - responsiveFontSize, wordWidth * progress, responsiveFontSize * 1.2);
              ctx.clip();
              ctx.fillStyle = "#FFFFFF"; // white for completed part
              ctx.fillText(wordText, currentX, yPos);
              ctx.restore();
            }

            currentX += wordWidth + spaceWidth;
          });

          // Clear shadow and reset alignment for subsequent drawing
          ctx.shadowColor = "transparent";
          ctx.textAlign = "center";
        } else {
          // Default style matching Python backend
          ctx.font = `bold ${responsiveFontSize}px Impact, Arial, sans-serif`;
          ctx.fillStyle = "#FFFFFF"; // primarycolor: white
          ctx.strokeStyle =
            selectedTextElement === "captions" && !displayOnly
              ? "#00FF00"
              : "#000000";
          ctx.lineWidth = Math.max(
            2,
            Math.round(responsiveFontSize * 0.02)
          ); // Thinner outline
          ctx.textAlign = "center"; // alignment: 2 (center)

          // Add shadow effect (shadow: 2.0, shadowcolor: black with 50% opacity)
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; // shadowcolor with 50% opacity
          ctx.shadowOffsetX = 1; // Softer shadow offset
          ctx.shadowOffsetY = 1; // Softer shadow offset
          ctx.shadowBlur = 0; // Sharp shadow like backend

          // Draw shadow first, then stroke, then fill
          ctx.strokeText(lineText, captionsX, yPos);
          ctx.fillText(lineText, captionsX, yPos);

          // Clear shadow for other elements
          ctx.shadowColor = "transparent";
        }
      });

      // Reset drawn flag for next frame
      activeWords.forEach((w) => ((w as any).drawn = false));

      // --- 3. Universal Selection & Resizing UI (only in edit mode) ---
      if (selectedTextElement === "captions" && !displayOnly) {
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]); // Dashed line for selection

        const padding = 12;
        const rectTop = startY - textBaseline - padding;
        const rectHeight = totalHeight + padding * 2;

        // Single rectangle around entire text block
        ctx.strokeRect(
          captionsX - maxLineWidth / 2 - padding,
          rectTop,
          maxLineWidth + padding * 2,
          rectHeight
        );
        
        ctx.setLineDash([]); // Reset line dash
        
        // Draw resize handles at all four corners
        const handleSize = 12;
        const rectLeft = captionsX - maxLineWidth / 2 - padding;
        const rectRight = captionsX + maxLineWidth / 2 + padding;
        const rectBottom = rectTop + rectHeight;
        
        const handles = [
          { x: rectLeft, y: rectTop, cursor: 'nw-resize' },
          { x: rectRight, y: rectTop, cursor: 'ne-resize' },
          { x: rectLeft, y: rectBottom, cursor: 'sw-resize' },
          { x: rectRight, y: rectBottom, cursor: 'se-resize' },
        ];
        
        handles.forEach((handle) => {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(handle.x, handle.y, handleSize / 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(handle.x, handle.y, handleSize / 2, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 1.5;
          const arrowSize = 2.5;
          ctx.beginPath();

          if (handle.cursor === 'nw-resize' || handle.cursor === 'se-resize') {
            ctx.moveTo(handle.x - arrowSize, handle.y - arrowSize);
            ctx.lineTo(handle.x + arrowSize, handle.y + arrowSize);
            ctx.moveTo(handle.x - arrowSize + 1, handle.y - arrowSize);
            ctx.lineTo(handle.x - arrowSize, handle.y - arrowSize + 1);
            ctx.moveTo(handle.x + arrowSize - 1, handle.y + arrowSize);
            ctx.lineTo(handle.x + arrowSize, handle.y + arrowSize - 1);
          } else {
            ctx.moveTo(handle.x - arrowSize, handle.y + arrowSize);
            ctx.lineTo(handle.x + arrowSize, handle.y - arrowSize);
            ctx.moveTo(handle.x - arrowSize, handle.y + arrowSize - 1);
            ctx.lineTo(handle.x - arrowSize + 1, handle.y + arrowSize);
            ctx.moveTo(handle.x + arrowSize, handle.y - arrowSize + 1);
            ctx.lineTo(handle.x + arrowSize - 1, handle.y - arrowSize);
          }
          ctx.stroke();
        });
      }
    }
  }, [
    hook,
    hookStyle,
    captionsStyle,
    selectedTextElement,
    getActiveWords,
    currentTime,
    captionStylePreference,
    displayOnly,
    calculateTextLayout,
  ]);

  // Animation loop for smooth rendering
  const animate = useCallback(() => {
    drawSubtitles();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [drawSubtitles]);

  // Start animation loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  // Handle window resize to update canvas size
  useEffect(() => {
    const handleResize = () => {
      drawSubtitles();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawSubtitles]);

  return (
    <div
      className={`relative aspect-[9/16] bg-black rounded-lg overflow-hidden ${className}`}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        controls
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
      />

      {/* Canvas overlay for subtitles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: (isEditMode && !displayOnly) ? "auto" : "none",
          cursor: dragState.isDragging
            ? "grabbing"
            : dragState.isResizing
            ? "nwse-resize"
            : "default",
        }}
        onMouseDown={(isEditMode && !displayOnly) ? handleCanvasMouseDown : undefined}
        onMouseMove={(isEditMode && !displayOnly) ? handleCanvasMouseMove : undefined}
        onMouseUp={(isEditMode && !displayOnly) ? handleCanvasMouseUp : undefined}
        onMouseLeave={(isEditMode && !displayOnly) ? handleCanvasMouseUp : undefined}
        onTouchStart={(isEditMode && !displayOnly) ? handleCanvasTouchStart : undefined}
        onTouchMove={(isEditMode && !displayOnly) ? handleCanvasTouchMove : undefined}
        onTouchEnd={(isEditMode && !displayOnly) ? handleCanvasTouchEnd : undefined}
      />
    </div>
  );
}
