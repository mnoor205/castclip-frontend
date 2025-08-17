"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { deleteProject } from "@/actions/delete"
import { toast } from "sonner"
import { Trash2, Loader2 } from "lucide-react"

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [isDeleting, startDeleteTransition] = useTransition()

    const handleDelete = () => {
        startDeleteTransition(async () => {
            try {
                await deleteProject(projectId);
                toast.success("Project deleted successfully");
                setDialogOpen(false);
            } catch (error: unknown) {
                if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
                    // This is expected, do nothing
                } else {
                    toast.error("Failed to delete project", {
                        description: error instanceof Error ? error.message : "An unknown error occurred.",
                    });
                }
            }
        });
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete the project and all its clips.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
