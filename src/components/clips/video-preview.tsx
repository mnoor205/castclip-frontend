"use client";

import { useRef, useEffect, useCallback } from "react";
import { useClipEditorStore } from "@/stores/clip-editor-store";

interface VideoPreviewProps {
  videoUrl: string;
  className?: string;
}

export function VideoPreview({ videoUrl, className = "" }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(null);

  const {
    currentTime,
    isPlaying,
    duration,
    transcript,
    hook,
    hookStyle,
    captionsStyle,
    selectedTextElement,
    dragState,
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
  } = useClipEditorStore();

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

  // Get text bounds for hit testing (handles multi-line text)
  const getTextBounds = useCallback(
    (
      text: string,
      position: { x: number; y: number },
      fontSize: number,
      canvas: HTMLCanvasElement,
      isHook: boolean = false
    ) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.font = `bold ${fontSize}px Impact, Arial, sans-serif`;

      // Process text into lines (same wrapping logic as drawing)
      let lines: string[];
      if (isHook) {
        const maxWidth = canvas.width * 0.9;
        const hookLines = text.split("\n");
        const wrappedLines: string[] = [];

        hookLines.forEach((line) => {
          if (line.trim() === "") {
            wrappedLines.push("");
            return;
          }

          const words = line.split(" ");
          let currentLine = "";

          for (const word of words) {
            const testLine = currentLine + (currentLine ? " " : "") + word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width <= maxWidth || currentLine === "") {
              currentLine = testLine;
            } else {
              wrappedLines.push(currentLine);
              currentLine = word;
            }
          }

          if (currentLine) {
            wrappedLines.push(currentLine);
          }
        });
        lines = wrappedLines;
      } else {
        const maxWidth = canvas.width * 0.9;
        const words = text.split(" ");
        const wrappedLines: string[] = [];
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine + (currentLine ? " " : "") + word;
          const metrics = ctx.measureText(testLine);

          if (metrics.width <= maxWidth || currentLine === "") {
            currentLine = testLine;
          } else {
            wrappedLines.push(currentLine);
            currentLine = word;
          }
        }

        if (currentLine) {
          wrappedLines.push(currentLine);
        }
        lines = wrappedLines;
      }

      if (lines.length === 0) return null;

      // Calculate overall bounds covering all lines (accounting for text baseline)
      const lineHeight = fontSize * 1.2;
      const totalHeight = lines.length * lineHeight;
      const maxLineWidth = Math.max(
        ...lines
          .filter((l) => l.trim())
          .map((line) => ctx.measureText(line).width)
      );
      const textBaseline = fontSize * 0.8; // Approximate baseline offset
      const padding = 12; // Same padding as visual rectangle

      // Calculate actual visual bounds (same as rectangle)
      const textX = (position.x / 100) * canvas.width;
      const textY = (position.y / 100) * canvas.height;
      const startY = textY - totalHeight / 2;
      const rectTop = startY - textBaseline - padding;
      const rectHeight = totalHeight + padding * 2;

      // Convert back to percentages
      const left = ((textX - maxLineWidth / 2 - padding) / canvas.width) * 100;
      const right = ((textX + maxLineWidth / 2 + padding) / canvas.width) * 100;
      const top = (rectTop / canvas.height) * 100;
      const bottom = ((rectTop + rectHeight) / canvas.height) * 100;

      return {
        left,
        right,
        top,
        bottom,
      };
    },
    []
  );

  // Check if coordinates are within resize handle and return which handle
  const getResizeHandle = useCallback(
    (
      coords: { x: number; y: number },
      textElement: "hook" | "captions",
      canvas: HTMLCanvasElement
    ): "top-left" | "top-right" | "bottom-left" | "bottom-right" | null => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const style = textElement === "hook" ? hookStyle : captionsStyle;
      const text =
        textElement === "hook"
          ? hook
          : getActiveWords()
              .map((w) => w.word)
              .join(" ");

      if (!text.trim()) return null;

      ctx.font = `bold ${style.fontSize}px Impact, Arial, sans-serif`;

      // Process text into lines (same logic as drawing)
      let lines: string[];
      if (textElement === "hook") {
        const maxWidth = canvas.width * 0.9;
        const hookLines = hook.split("\n");
        const wrappedLines: string[] = [];

        hookLines.forEach((line) => {
          if (line.trim() === "") {
            wrappedLines.push("");
            return;
          }

          const words = line.split(" ");
          let currentLine = "";

          for (const word of words) {
            const testLine = currentLine + (currentLine ? " " : "") + word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width <= maxWidth || currentLine === "") {
              currentLine = testLine;
            } else {
              wrappedLines.push(currentLine);
              currentLine = word;
            }
          }

          if (currentLine) {
            wrappedLines.push(currentLine);
          }
        });
        lines = wrappedLines;
      } else {
        const maxWidth = canvas.width * 0.9;
        const words = text.split(" ");
        const wrappedLines: string[] = [];
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine + (currentLine ? " " : "") + word;
          const metrics = ctx.measureText(testLine);

          if (metrics.width <= maxWidth || currentLine === "") {
            currentLine = testLine;
          } else {
            wrappedLines.push(currentLine);
            currentLine = word;
          }
        }

        if (currentLine) {
          wrappedLines.push(currentLine);
        }
        lines = wrappedLines;
      }

      const maxLineWidth = Math.max(
        ...lines
          .filter((l) => l.trim())
          .map((line) => ctx.measureText(line).width)
      );
      const handleSize = 12;
      const padding = 12;
      const textX = (style.position.x / 100) * canvas.width;
      const textY = (style.position.y / 100) * canvas.height;
      const lineHeight = style.fontSize * 1.2;
      const totalHeight = lines.length * lineHeight;
      const startY = textY - totalHeight / 2;
      const textBaseline = style.fontSize * 0.8; // Same baseline offset as visual

      // Calculate handle positions (same as visual rectangle)
      const rectTop = startY - textBaseline - padding;
      const rectHeight = totalHeight + padding * 2;
      const rectLeft = textX - maxLineWidth / 2 - padding;
      const rectRight = textX + maxLineWidth / 2 + padding;
      const rectBottom = rectTop + rectHeight;

      const coordsInPixels = {
        x: (coords.x / 100) * canvas.width,
        y: (coords.y / 100) * canvas.height,
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
          startResize("hook", handle);
          return;
        }
      }

      if (selectedTextElement === "captions") {
        const handle = getResizeHandle(coords, "captions", canvas);
        if (handle) {
          startResize("captions", handle);
          return;
        }
      }

      // Check if click/touch is on hook text
      if (hook.trim()) {
        const hookBounds = getTextBounds(
          hook,
          hookStyle.position,
          hookStyle.fontSize,
          canvas,
          true
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
          captionText,
          captionsStyle.position,
          captionsStyle.fontSize,
          canvas,
          false
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
            ? "nw-resize"
            : "ne-resize";
        }
      }
      if (selectedTextElement === "captions") {
        const handle = getResizeHandle(coords, "captions", canvas);
        if (handle) {
          return handle === "top-left" || handle === "bottom-right"
            ? "nw-resize"
            : "ne-resize";
        }
      }

      // Check for text hover
      if (hook.trim()) {
        const hookBounds = getTextBounds(
          hook,
          hookStyle.position,
          hookStyle.fontSize,
          canvas,
          true
        );
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
        const captionText = activeWords.map((w) => w.word).join(" ");
        const captionBounds = getTextBounds(
          captionText,
          captionsStyle.position,
          captionsStyle.fontSize,
          canvas,
          false
        );
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
      hookStyle,
      captionsStyle,
      getTextBounds,
      getActiveWords,
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
      } else if (dragState.isResizing && dragState.dragTarget) {
        // Handle resizing - calculate new font size based on mouse movement
        const startPosition =
          dragState.dragTarget === "hook"
            ? hookStyle.position
            : captionsStyle.position;

        // Calculate distance from original position to determine size
        const distanceFromCenter = Math.sqrt(
          Math.pow(coords.x - startPosition.x, 2) +
            Math.pow(coords.y - startPosition.y, 2)
        );

        // Convert distance to font size (with some scaling factor)
        const baseFontSize = dragState.dragTarget === "hook" ? 24 : 32;
        const newFontSize = Math.max(
          12,
          Math.min(72, baseFontSize + (distanceFromCenter - 20) * 0.5)
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
          startResize("hook", handle);
          return;
        }
      }

      if (selectedTextElement === "captions") {
        const handle = getResizeHandle(coords, "captions", canvas);
        if (handle) {
          startResize("captions", handle);
          return;
        }
      }

      // Check if touch is on hook text
      if (hook.trim()) {
        const hookBounds = getTextBounds(
          hook,
          hookStyle.position,
          hookStyle.fontSize,
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
          captionText,
          captionsStyle.position,
          captionsStyle.fontSize,
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
      } else if (dragState.isResizing && dragState.dragTarget) {
        // Handle resizing
        const startPosition =
          dragState.dragTarget === "hook"
            ? hookStyle.position
            : captionsStyle.position;

        const distanceFromCenter = Math.sqrt(
          Math.pow(coords.x - startPosition.x, 2) +
            Math.pow(coords.y - startPosition.y, 2)
        );

        const baseFontSize = dragState.dragTarget === "hook" ? 24 : 32;
        const newFontSize = Math.max(
          12,
          Math.min(72, baseFontSize + (distanceFromCenter - 20) * 0.5)
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

    // Set canvas size to match video display size
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw hook (always visible at top)
    if (hook.trim()) {
      ctx.font = `bold ${hookStyle.fontSize}px Impact, Arial, sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = selectedTextElement === "hook" ? "#00FF00" : "#000000";
      ctx.lineWidth = 3;
      ctx.textAlign = "center";

      const maxWidth = canvas.width * 0.9; // 90% of canvas width
      const hookLines = hook.split("\n"); // Support line breaks from user input
      const wrappedLines: string[] = [];

      // Process each line and wrap if needed
      hookLines.forEach((line) => {
        if (line.trim() === "") {
          wrappedLines.push(""); // Preserve empty lines
          return;
        }

        const words = line.split(" ");
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine + (currentLine ? " " : "") + word;
          const metrics = ctx.measureText(testLine);

          if (metrics.width <= maxWidth || currentLine === "") {
            currentLine = testLine;
          } else {
            wrappedLines.push(currentLine);
            currentLine = word;
          }
        }

        if (currentLine) {
          wrappedLines.push(currentLine);
        }
      });

      // Calculate position from percentage
      const hookX = (hookStyle.position.x / 100) * canvas.width;
      const hookY = (hookStyle.position.y / 100) * canvas.height;

      // Draw each line of the hook
      const lineHeight = hookStyle.fontSize * 1.2;
      const totalHeight = wrappedLines.length * lineHeight;
      const startY = hookY - totalHeight / 2;

      wrappedLines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        if (line.trim()) {
          // Only draw non-empty lines
          ctx.strokeText(line, hookX, y);
          ctx.fillText(line, hookX, y);
        }
      });

      // Draw selection indicator for hook
      if (selectedTextElement === "hook") {
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        const padding = 12;
        const maxLineWidth = Math.max(
          ...wrappedLines
            .filter((l) => l.trim())
            .map((line) => ctx.measureText(line).width)
        );

        // Calculate proper text bounds (accounting for text baseline)
        const textBaseline = hookStyle.fontSize * 0.8; // Approximate baseline offset
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
    if (activeWords.length > 0) {
      ctx.font = `bold ${captionsStyle.fontSize}px Impact, Arial, sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle =
        selectedTextElement === "captions" ? "#00FF00" : "#000000";
      ctx.lineWidth = 4;
      ctx.textAlign = "center";

      // Combine active words into phrases
      const text = activeWords.map((w) => w.word).join(" ");

      // Handle text wrapping for long phrases
      const maxWidth = canvas.width * 0.9; // 90% of canvas width
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine + (currentLine ? " " : "") + word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width <= maxWidth || currentLine === "") {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      // Calculate position from percentage
      const captionsX = (captionsStyle.position.x / 100) * canvas.width;
      const captionsY = (captionsStyle.position.y / 100) * canvas.height;

      // Position text based on store position
      const lineHeight = captionsStyle.fontSize * 1.2;
      const totalTextHeight = lines.length * lineHeight;
      const startY = captionsY - totalTextHeight / 2;

      // Draw each line
      lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        ctx.strokeText(line, captionsX, y);
        ctx.fillText(line, captionsX, y);
      });

      // Draw selection indicator for captions
      if (selectedTextElement === "captions") {
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        const padding = 12;
        const maxLineWidth = Math.max(
          ...lines
            .filter((l) => l.trim())
            .map((line) => ctx.measureText(line).width)
        );

        // Calculate proper text bounds (accounting for text baseline)
        const textBaseline = captionsStyle.fontSize * 0.8; // Approximate baseline offset
        const rectTop = startY - textBaseline - padding;
        const rectHeight = totalTextHeight + padding * 2;

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
  }, [hook, hookStyle, captionsStyle, selectedTextElement, getActiveWords]);

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

      {/* Canvas overlay for subtitles - only when text exists */}
      {(hook.trim() || getActiveWords().length > 0) && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: selectedTextElement ? "auto" : "none",
            cursor: dragState.isDragging
              ? "grabbing"
              : dragState.isResizing
              ? "nw-resize"
              : "default",
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
        />
      )}
    </div>
  );
}
