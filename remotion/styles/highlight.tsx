import { TranscriptWord } from "@/lib/types";

interface Props {
  activeWords: TranscriptWord[];
  currentTime: number;
}

export const HighlightStyle: React.FC<Props> = ({ activeWords, currentTime }) => {
  let lastSpokenWord: TranscriptWord | undefined;
  for (let i = activeWords.length - 1; i >= 0; i--) {
    if (currentTime >= activeWords[i].start) {
      lastSpokenWord = activeWords[i];
      break;
    }
  }

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
          const isHighlighted = word === lastSpokenWord;
          return (
            <span
              key={word.start}
              className={isHighlighted ? "text-red-600" : "text-white"}
            >
              {word.word}{" "}
            </span>
          );
        })}
      </span>
    </p>
  );
};