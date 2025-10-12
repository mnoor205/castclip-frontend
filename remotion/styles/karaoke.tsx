import { TranscriptWord } from "@/lib/types";
import { interpolate } from "remotion";

interface Props {
  activeWords: TranscriptWord[];
  currentTime: number;
}

export const KaraokeStyle: React.FC<Props> = ({ activeWords, currentTime }) => {
  return (
    <p
      style={{
        fontFamily: "Impact",
        margin: 0,
        textTransform: "uppercase",
        textShadow: "2px 0 #000, -2px 0 #000, 0 2px #000, 0 -2px #000, 1px 1px #000, -1px -1px #000, 1px -1px #000, -1px 1px #000",
      }}
      className="text-center"
    >
      <span
        className="inline-block"
        data-measure-target
      >
        {activeWords.map((word, i) => {
          const currentPosition = interpolate(
            currentTime,
            [word.start, word.end],
            [0, 100],
            { extrapolateRight: "clamp" }
          );

          return (
            <span key={i} className="relative inline-block mr-3">
              {/* Base gray word in normal flow */}
              <span className="text-neutral-100">{word.word}</span>

              {/* Orange overlay clipped */}
              <span
                className="absolute left-0 top-0 text-orange-400"
                style={{
                  clipPath: `polygon(0 0, ${currentPosition}% 0, ${currentPosition}% 100%, 0 100%)`,
                }}
              >
                {word.word}
              </span>
            </span>
          );
        })}
      </span>
    </p>
  );
};
