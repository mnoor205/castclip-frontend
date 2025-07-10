"use client"
import { Clip } from "@prisma/client"
import { Button } from "../ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import Dropzone from "shadcn-dropzone"
import { Loader2, UploadCloud, CheckCircle2, Sparkles } from "lucide-react"
import { useState } from "react"
import { generateUploadUrl } from "@/actions/s3"
import { toast } from "sonner"
import { processVideo } from "@/actions/generation"
import { Table, TableCell, TableHead, TableHeader, TableRow, TableBody } from "../ui/table"
import { Badge } from "../ui/badge"
import { useRouter } from "next/navigation"
import { ClipDisplay } from "./clip-display"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import Image from "next/image"

type VideoType = {
    id: number
    title: string
    description: string
    exampleVideoUrl: string
    status?: 'beta' | 'coming-soon'
}

const VIDEO_TYPES: VideoType[] = [
    {
        id: 1,
        title: "Classic Captions",
        description: "Clean, readable subtitles for a professional look.",
        exampleVideoUrl: "https://castclip.revolt-ai.com/app/examples/subtitles/default.gif",
    },
    {
        id: 2,
        title: "Emoji Captions",
        description: "Engaging captions with relevant emojis that animate.",
        exampleVideoUrl: "https://castclip.revolt-ai.com/app/examples/subtitles/emoji.gif",
        status: 'beta'
    },
    {
        id: 3,
        title: "Karaoke Style",
        description: "Words are highlighted as they are spoken, like karaoke.",
        exampleVideoUrl: "https://castclip.revolt-ai.com/app/examples/subtitles/karaoke.gif",
    },
    {
        id: 4,
        title: "More Styles Coming Soon",
        description: "We're always working on new and exciting caption styles.",
        exampleVideoUrl: "",
        status: 'coming-soon'
    }
]

export default function DashboardPage({
    uploadedFiles,
    clips,
    credits
}: {
    uploadedFiles: {
        id: string,
        s3Key: string,
        fileName: string,
        status: string,
        clipsCount: number,
        createdAt: Date
    }[],
    clips: Clip[],
    credits: number
}) {
    const [files, setFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)
    const [refreshing, setRefreshing] = useState<boolean>(false)
    const [clipCount, setClipCount] = useState<number>(1)
    const [captionStyle, setCaptionStyle] = useState<number>(1)
    const router = useRouter()

    const handleRefresh = async () => {
        setRefreshing(true)
        router.refresh()
        setTimeout(() => setRefreshing(false), 600)
    }

    const handleDrop = (acceptedFiles: File[]) => {
        setFiles(acceptedFiles)
    }

    const handleVideoTypeSelect = (typeId: number) => {
        setCaptionStyle(typeId)
    }

    const handleUpload = async () => {
        if (files.length === 0) return

        if (credits <= 0) {
            toast("Please purchase credits to generate clips", {
                description: `Current Credits: ${credits}`
            })
            return
        }

        const file = files[0]!
        setUploading(true)

        try {
            const { success, signedUrl, uploadedFileId } = await generateUploadUrl({
                fileName: file.name,
                contentType: file.type,
                clipCount: clipCount,
                captionStyle: captionStyle
            })

            if (!success) throw new Error("Failed to get upload URL")

            const uploadResponse = await fetch(signedUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type
                }
            })

            if (!uploadResponse.ok) throw new Error(`Upload failed with status: ${uploadResponse.status}`)

            await processVideo(uploadedFileId, clipCount, captionStyle)

            setFiles([])

            toast.success("Video Uploaded Successfully", {
                description: "Your video has begun processing, it may take up to 15 minutes. We will send you an email when processing is complete!",
                duration: 8000,
                style: {
                    color: 'black',
                    backgroundColor: 'white'
                },
                className: '[&_*]:!text-black'
            })
        } catch (error) {
            console.error(error)
            
            // More specific error handling
            let errorDescription = "There was a problem uploading your video. Please try again."
            
            if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                    errorDescription = "The request timed out. Your video may still be processing. Check the Queue tab in a few minutes."
                } else if (error.message.includes('credits')) {
                    errorDescription = "Insufficient credits to process this video."
                } else if (error.message.includes('Database')) {
                    errorDescription = "Database connection issue. Please try again in a moment."
                }
            }
            
            toast.error("Upload Failed", {
                description: errorDescription,
                duration: 8000
            })
        } finally {
            setUploading(false)
        }
    }

    const handleClipCountChange = (value: number) => {
        setClipCount(value)
    }

    return (
        <div className="mx-auto flex max-w-6xl flex-col space-y-6 px-4 py-8">

            <Tabs defaultValue="upload">
                <TabsList>
                    <TabsTrigger value="upload">Upload</TabsTrigger>
                    <TabsTrigger value="my-clips">My Clips</TabsTrigger>
                    <TabsTrigger value="queue">Queue Status</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-6">
                    {/* Upload & Styling Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload & Style Your Podcast</CardTitle>
                            <CardDescription>
                                Upload your audio or video and choose a caption style for your clips
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Upload Dropzone */}
                            <div>
                                <h3 className="text-lg font-medium mb-3">Upload Your File</h3>
                                <Dropzone
                                    onDrop={handleDrop}
                                    accept={{ "video/mp4": [".mp4"] }}
                                    maxSize={2000 * 1024 * 1024}
                                    maxFiles={1}
                                    disabled={uploading}
                                >
                                    {() => (
                                        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg p-10 text-center">
                                            <UploadCloud className="text-muted-foreground h-12 w-12" />
                                            <p className="font-medium">Drag and drop your file</p>
                                            <p className="text-muted-foreground text-sm">
                                                or click to browse [MP4 up to 2GB]
                                            </p>
                                            <Button size="sm" disabled={uploading} className="bg-gradient-primary text-white hover:opacity-90 transition-opacity">
                                                Select File
                                            </Button>
                                        </div>
                                    )}
                                </Dropzone>

                                {files.length > 0 && (
                                    <div className="mt-3 space-y-1 text-sm">
                                        <p className="font-medium">Selected Files:</p>
                                        {files.map((file) => (
                                            <p key={file.name} className="text-muted-foreground">
                                                {file.name}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Video Type Selection */}
                            <div>
                                <h3 className="text-lg font-medium mb-3">Choose Your Caption Style</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {VIDEO_TYPES.map((type) => {
                                        const isComingSoon = type.status === 'coming-soon'
                                        const isSelected = captionStyle === type.id

                                        return (
                                            <div
                                                key={type.id}
                                                className={`group relative rounded-xl border-2 transition-all duration-200 ${
                                                    isComingSoon
                                                        ? 'cursor-not-allowed bg-muted/40'
                                                        : 'cursor-pointer hover:shadow-lg'
                                                } ${
                                                    isSelected && !isComingSoon
                                                        ? "border-primary bg-primary/5 shadow-md"
                                                        : "border-border hover:border-primary/50"
                                                }`}
                                                onClick={() => !isComingSoon && handleVideoTypeSelect(type.id)}
                                            >
                                                {/* Selection Indicator */}
                                                {isSelected && !isComingSoon && (
                                                    <div className="absolute -top-2 -right-2 z-10">
                                                        <div className="bg-primary rounded-full p-1">
                                                            <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Beta Badge */}
                                                {type.status === 'beta' && (
                                                    <div className="absolute top-2 left-2 z-10">
                                                        <Badge variant="default" className="bg-primary text-white border border-pink-500/50">
                                                            Beta
                                                        </Badge>
                                                    </div>
                                                )}

                                                {/* Video Preview or Coming Soon */}
                                                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                                                    {isComingSoon ? (
                                                        <div className="flex h-full w-full items-center justify-center">
                                                            <Sparkles className="h-10 w-10 text-muted-foreground/50" />
                                                        </div>
                                                    ) : (
                                                        <Image
                                                            className="h-full w-full object-cover"
                                                            src={type.exampleVideoUrl}
                                                            alt={`${type.title} preview`}
                                                            width={400}
                                                            height={225}
                                                            key={type.exampleVideoUrl}
                                                            unoptimized
                                                        />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="p-4">
                                                    <h3 className="font-semibold text-sm mb-2">{type.title}</h3>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                                        {type.description}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Upload Controls */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Number of clips:</span>
                                    <Select onValueChange={(value) => handleClipCountChange(Number(value))}>
                                        <SelectTrigger className="w-20">
                                            <SelectValue placeholder={clipCount} defaultValue={clipCount} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1</SelectItem>
                                            <SelectItem value="2">2</SelectItem>
                                            <SelectItem value="3">3</SelectItem>
                                            <SelectItem value="4">4</SelectItem>
                                            <SelectItem value="5">5</SelectItem>
                                            <SelectItem value="6">6</SelectItem>
                                            <SelectItem value="7">7</SelectItem>
                                            <SelectItem value="8">8</SelectItem>
                                            <SelectItem value="9">9</SelectItem>
                                            <SelectItem value="10">10</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleUpload} disabled={files.length === 0 || uploading} size="lg" className="bg-gradient-primary text-white hover:opacity-90 transition-opacity">
                                    {uploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        "Upload and Generate Clips"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="queue">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Processing Queue</CardTitle>
                                    <CardDescription>Track the progress of your uploaded videos and processing status</CardDescription>
                                </div>
                                <Button size="sm" onClick={handleRefresh} disabled={refreshing} className="bg-gradient-primary text-white hover:opacity-90 transition-opacity">
                                    {refreshing && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {uploadedFiles.length > 0 ? (
                                <div className="max-h-[400px] overflow-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>File</TableHead>
                                                <TableHead>Uploaded</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Clips Created</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[...uploadedFiles]
                                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                .map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="max-w-xs truncate font-medium">
                                                            {item.fileName}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground font-sm">
                                                            {new Date(item.createdAt).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.status === "queued" && (
                                                                <Badge className="bg-blue-500 text-white">Queued</Badge>
                                                            )}
                                                            {item.status === "processing" && (
                                                                <Badge className="bg-yellow-500 text-white">Processing</Badge>
                                                            )}
                                                            {item.status === "processed" && (
                                                                <Badge className="bg-green-500 text-white">Processed</Badge>
                                                            )}
                                                            {item.status === "failed" && (
                                                                <Badge className="bg-red-500 text-white">Failed</Badge>
                                                            )}
                                                            {item.status === "no credits" && (
                                                                <Badge className="bg-orange-500 text-white">No Credits</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {item.clipsCount > 0 ? (
                                                                <span>{item.clipsCount} clip{item.clipsCount !== 1 ? "s" : ""}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground">No Clips Yet</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-muted-foreground">
                                        <p className="text-lg font-medium mb-2">No uploads yet</p>
                                        <p className="text-sm">Upload your first podcast to see processing status here</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="my-clips">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Clips</CardTitle>
                            <CardDescription>View and manage your generated clips. Processing may take a few minutes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ClipDisplay clips={clips} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    )
}