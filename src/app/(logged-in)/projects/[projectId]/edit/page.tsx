import { prismaDB } from "@/lib/prisma";
import { getUserData } from "@/actions/user";
import { redirect } from "next/navigation";
import { MultiClipEditor } from "@/components/clips/multi-clip-editor";
import BackButton from "@/components/navigation/back-button";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface EditPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

async function EditPageContent({ projectId }: { projectId: string }) {
  const user = await getUserData();
  if (!user?.id) {
    redirect("/sign-in");
  }

  const project = await prismaDB.project.findFirst({
    where: {
      id: projectId,
      userId: user.id,
    },
    include: {
      Clip: {
        orderBy: {
          createdAt: 'asc' // Show clips in order they were created
        }
      },
    },
  });

  if (!project) {
    redirect("/projects");
  }

  // Filter out clips without transcript data (can't be edited)
  const editableClips = project.Clip.filter(clip => 
    clip.transcript && 
    Array.isArray(clip.transcript) && 
    clip.transcript.length > 0 &&
    (clip.rawClipUrl || clip.s3Key)
  );

  if (editableClips.length === 0) {
    return (
      <div className="w-full flex flex-col gap-8 px-6 py-10">
        <div className="flex items-center gap-4">
          <BackButton fallbackHref={`/projects/${project.id}`} />
          <h1 className="text-2xl sm:text-3xl font-bold">Edit Clips</h1>
        </div>
        
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Editable Clips Found
            </h2>
            <p className="text-gray-600 mb-4">
              The clips in this project don't have transcript data or are still processing.
            </p>
            <p className="text-sm text-gray-500">
              Only clips with word-level transcripts can be edited.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const title = project.displayName ?? "Untitled Project";

  return (
    <div className="w-full flex flex-col gap-6 px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton fallbackHref={`/projects/${project.id}`} />
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
            Edit: {title}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {editableClips.length} clip{editableClips.length !== 1 ? 's' : ''} available for editing
          </p>
        </div>
      </div>

      {/* Multi-Clip Editor */}
      <MultiClipEditor 
        projectId={project.id}
        clips={editableClips}
        projectTitle={title}
      />
    </div>
  );
}

function EditPageSkeleton() {
  return (
    <div className="w-full flex flex-col gap-6 px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="aspect-[9/16] w-full max-w-[400px]" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

export default async function EditPage({ params }: EditPageProps) {
  const { projectId } = await params;

  return (
    <Suspense fallback={<EditPageSkeleton />}>
      <EditPageContent projectId={projectId} />
    </Suspense>
  );
}

