"use client"
import { Clip } from "@prisma/client"
import Link from "next/link"
import { Button } from "../ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import Dropzone from "shadcn-dropzone"
import { Loader2, UploadCloud } from "lucide-react"
import { useState } from "react"
import { generateUploadUrl } from "@/actions/s3"
import { toast } from "sonner"
import { processVideo } from "@/actions/generation"
import { Table, TableCell, TableHead, TableHeader, TableRow, TableBody } from "../ui/table"
import { Badge } from "../ui/badge"
import { useRouter } from "next/navigation"
import { ClipDisplay } from "./clip-display"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

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
    const router = useRouter()

    const handleRefresh = async () => {
        setRefreshing(true)
        router.refresh()
        setTimeout(() => setRefreshing(false), 600)
    }

    const handleDrop = (acceptedFiles: File[]) => {
        setFiles(acceptedFiles)
    }

    const handleUpload = async () => {
        if (files.length === 0) return

        if(credits <= 0) {
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
                clipCount: clipCount
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

            await processVideo(uploadedFileId, clipCount)

            setFiles([])

            toast.success("Video Uploaded Successfully", {
                description: "Your video has been scheduled for processing. Check the status below",
                duration: 5000
            })
        } catch (error) {
            console.error(error)
            toast.error("Upload Failed", {
                description: "There was a problem uploading your video. Please try again.",
                duration: 5000
            })
        } finally {
            setUploading(false)
        }
    }

    const handleClipCountChange = (value: number) => {
        setClipCount(value)
    }

    return (
        <div className="mx-auto flex max-w-5xl flex-col space-y-6 px-4 py-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Podcast Clipper
                    </h1>
                    <p className="text-muted-foreground">
                        Upload your podcast and get AI-generated clips instantly
                    </p>
                </div>
                <Link href="/dashboard/billing">
                    <Button>
                        Buy Credits
                    </Button>
                </Link>
            </div>

            <Tabs defaultValue="upload">
                <TabsList>
                    <TabsTrigger value="upload">Upload</TabsTrigger>
                    <TabsTrigger value="my-clips">My Clips</TabsTrigger>
                </TabsList>

                <TabsContent value="upload">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Podcast</CardTitle>
                            <CardDescription>
                                Upload your audio or video to generate clips
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Dropzone
                                onDrop={handleDrop}
                                accept={{ "video/mp4": [".mp4"] }}
                                maxSize={500 * 1024 * 1024}
                                maxFiles={1}
                                disabled={uploading}
                            >
                                {() => (
                                    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg p-10 text-center">
                                        <UploadCloud className="text-muted-foreground h-12 w-12" />
                                        <p className="font-medium">Drag and drop your file</p>
                                        <p className="text-muted-foreground text-sm">
                                            or click to browse [MP4 up to 500MB]
                                        </p>
                                        <Button variant="default" size="sm" disabled={uploading}>
                                            Select File
                                        </Button>
                                    </div>
                                )}
                            </Dropzone>

                            <div className="mt-2 flex items-start justify-between">
                                <div>
                                    {files.length > 0 && (
                                        <div className="space-y-1 text-sm">
                                            <p className="font-medium">Selected Files:</p>
                                            {files.map((file) => (
                                                <p key={file.name} className="text-muted-foreground">
                                                    {file.name}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select onValueChange={(value) => handleClipCountChange(Number(value))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={clipCount} defaultValue={clipCount} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1</SelectItem>
                                            <SelectItem value="2">2</SelectItem>
                                            <SelectItem value="3">3</SelectItem>
                                            <SelectItem value="4">4</SelectItem>
                                            <SelectItem value="5">5</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleUpload} disabled={files.length === 0 || uploading}>
                                        {uploading ? (
                                            <>
                                                <Loader2 className="mr-2 m-4 h-4 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            "Upload and Generate Clips"
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {uploadedFiles.length > 0 && (
                                <div className="pt-6">
                                    <div className="mb-2 flex items-center justify-between">
                                        <h3 className="text-md mb-2 font-medium">Queue Status</h3>
                                        <Button variant={"outline"} size={"sm"} onClick={handleRefresh} disabled={refreshing}>
                                        {refreshing && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                            Refresh
                                        </Button>
                                    </div>

                                    <div className="max-h-[300px] overflow-auto rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>File</TableHead>
                                                    <TableHead>Uploaded</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Clip Created</TableHead>
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