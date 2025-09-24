import { TranscriptWord } from "@/lib/types";

interface Props {
  activeWords: TranscriptWord[];
  currentTime: number;
}

export const HighlightStyle: React.FC<Props> = ({ activeWords, currentTime }) => {
  return (
    <p
      style={{ fontFamily: "Anton", margin: 0 }}
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