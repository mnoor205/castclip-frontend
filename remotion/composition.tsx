import { TranscriptWord } from "@/lib/types";
import {
  AbsoluteFill,
  OffthreadVideo,
  useVideoConfig,
} from "remotion";
import { Captions } from "./captions";
import { TextStyle } from "@/stores/clip-editor-store";
import { CLIP_CONFIG, VIDEO_GENERATION } from "@/lib/constants";

interface Props {
  videoUrl?: string;
  transcript?: TranscriptWord[];
  hook?: string;
  hookStyle?: TextStyle | null;
  captionsStyle?: TextStyle | null;
  captionStyleId?: number | null;
}

const defaultHookStyle = CLIP_CONFIG.DEFAULT_HOOK_STYLE;
const defaultCaptionsStyle = CLIP_CONFIG.DEFAULT_CAPTIONS_STYLE;
const defaultCaptionStyleId = VIDEO_GENERATION.DEFAULT_CAPTION_STYLE;

const commonTextStyles: React.CSSProperties = {
  color: "white",
  fontWeight: 700,
  textAlign: "center",
  lineHeight: 1.1,
  whiteSpace: "pre-wrap",
  padding: "4px 8px",
  pointerEvents: "none",
};

const HookLayer: React.FC<{ text: string; style: TextStyle }> = ({ text, style }) => {
  const { width } = useVideoConfig();
  if (!text.trim()) {
    return null;
  }

  return (
    <div
      data-editor-element="hook"
      style={{
        ...commonTextStyles,
        position: "absolute",
        left: `${style.position.x}%`,
        top: `${style.position.y}%`,
        transform: "translate(-50%, -50%)",
        fontSize: `${style.fontSize}px`,
        fontFamily: "Impact",
        textTransform: "uppercase",
        textShadow: "3px 0 #000, -3px 0 #000, 0 3px #000, 0 -3px #000, 2px 2px #000, -2px -2px #000, 2px -2px #000, -2px 2px #000",
        width: `${width * ((CLIP_CONFIG.POSITION_BOUNDS.MAX - CLIP_CONFIG.POSITION_BOUNDS.MIN) / 100)}px`,
      }}
    >
      <span
        data-measure-target
        className="inline-block"
      >
        {text}
      </span>
    </div>
  );
};

export const RemotionComposition: React.FC<Props> = ({
  videoUrl = "",
  transcript = [],
  hook = "",
  hookStyle,
  captionsStyle,
  captionStyleId,
}) => {
  const resolvedHookStyle = hookStyle ?? defaultHookStyle;
  const resolvedCaptionsStyle = captionsStyle ?? defaultCaptionsStyle;
  const resolvedCaptionStyleId = captionStyleId ?? defaultCaptionStyleId;

  return (
    <AbsoluteFill className="bg-black">
      <OffthreadVideo src={videoUrl} />
      <HookLayer text={hook} style={resolvedHookStyle} />
      <Captions
        transcript={transcript}
        captionStyleId={resolvedCaptionStyleId}
        style={resolvedCaptionsStyle}
      />
    </AbsoluteFill>
  );
};
