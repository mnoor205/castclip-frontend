import { TranscriptWord } from "@/lib/types";

interface Props {
  activeWords: TranscriptWord[];
  currentTime: number;
}

export const HighlightStyle: React.FC<Props> = ({ activeWords, currentTime }) => {
  return (
    <p
      style={{
        fontFamily: "Impact",
        margin: 0,
        textShadow: "2px 0 #000, -2px 0 #000, 0 2px #000, 0 -2px #000, 1px 1px #000, -1px -1px #000, 1px -1px #000, -1px 1px #000",
      }}
      className="text-center"
    >
      <span
        className="inline-block"
        data-measure-target
      >
        {activeWords.map((word) => {
          const isSpoken = currentTime >= word.start && currentTime <= word.end;
          return (
            <span
              key={word.start}
              className={isSpoken ? "text-red-500" : "text-white"}
            >
              {word.word}{" "}
            </span>
          );
        })}
      </span>
    </p>
  );
};