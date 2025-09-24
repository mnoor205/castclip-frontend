import { TranscriptWord } from "@/lib/types";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { HighlightStyle } from "./styles/highlight";
import { KaraokeStyle } from "./styles/karaoke";
import { TextStyle } from "@/stores/clip-editor-store";
import { CLIP_CONFIG, VIDEO_GENERATION } from "@/lib/constants";

const commonTextStyles: React.CSSProperties = {
  color: "white",
  fontWeight: 700,
  textAlign: "center",
  lineHeight: 1.1,
  whiteSpace: "pre-wrap",
  padding: "4px 8px",
  pointerEvents: "none",
};

interface Props {
  transcript: TranscriptWord[];
  captionStyleId: number | null;
  style?: TextStyle | null;
}

export const Captions: React.FC<Props> = ({ transcript, captionStyleId, style }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const currentTime = frame / fps;
  const resolvedStyle = style ?? CLIP_CONFIG.DEFAULT_CAPTIONS_STYLE;
  const resolvedCaptionStyleId = captionStyleId ?? VIDEO_GENERATION.DEFAULT_CAPTION_STYLE;

  let activeWordIndex = transcript.findIndex(
    (word) => currentTime >= word.start && currentTime <= word.end
  );

  if (activeWordIndex === -1) {
    let lastSpokenWordIndex = -1;
    for (let i = transcript.length - 1; i >= 0; i--) {
      if (currentTime > transcript[i].end) {
        lastSpokenWordIndex = i;
        break;
      }
    }
    activeWordIndex = lastSpokenWordIndex !== -1 ? lastSpokenWordIndex : 0;
  }

  const chunkIndex = Math.floor(activeWordIndex / 3);
  const startOfChunk = chunkIndex * 3;
  const endOfChunk = startOfChunk + 3;
  const activeWords = transcript.slice(startOfChunk, endOfChunk);

  const renderStyle = () => {
    switch (resolvedCaptionStyleId) {
      case 3:
        return <KaraokeStyle activeWords={activeWords} currentTime={currentTime} />;
      case 1:
      default:
        return <HighlightStyle activeWords={activeWords} currentTime={currentTime} />;
    }
  };

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        data-editor-element="captions"
        style={{
          ...commonTextStyles,
          position: "absolute",
          left: `${resolvedStyle.position.x}%`,
          top: `${resolvedStyle.position.y}%`,
          transform: "translate(-50%, -50%)",
          fontSize: `${resolvedStyle.fontSize}px`,
          width: `${width * ((CLIP_CONFIG.POSITION_BOUNDS.MAX - CLIP_CONFIG.POSITION_BOUNDS.MIN) / 100)}px`,
        }}
      >
        {renderStyle()}
      </div>
    </AbsoluteFill>
  )
}