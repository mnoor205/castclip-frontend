import React from "react"
import { Composition } from 'remotion'
import { RemotionComposition } from "./composition"
import "./globals.css"
import { CLIP_CONFIG, VIDEO_GENERATION } from "@/lib/constants"

export const RemotionRoot: React.FC = () => {
    return (
        <>
        <Composition 
           id="Empty"
           component={RemotionComposition}
           durationInFrames={60}
           fps={30}
           width={1080}
           height={1920}
           defaultProps={{
             videoUrl: "",
             transcript: [],
             hook: "",
             hookStyle: CLIP_CONFIG.DEFAULT_HOOK_STYLE,
             captionsStyle: CLIP_CONFIG.DEFAULT_CAPTIONS_STYLE,
             captionStyleId: VIDEO_GENERATION.DEFAULT_CAPTION_STYLE,
           }}
        />
        </>
    )
}