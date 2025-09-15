import { prismaDB } from "@/lib/prisma";
import { getUserData } from "@/actions/user";
import { redirect } from "next/navigation";
import BackButton from "@/components/navigation/back-button";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SingleClipEditor } from "@/components/editor/single-clip-editor";
import { isClipEditable } from "@/lib/constants";

interface EditClipPageProps {
  params: Promise<{
    projectId: string;
    clipId: string;
  }>;
}

async function EditClipPageContent({ projectId, clipId }: { projectId: string, clipId: string }) {
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
        where: {
          id: clipId,
        }
      }
    }
  });

  if (!project || project.Clip.length === 0) {
    redirect(`/projects/${projectId}`);
  }

  const clip = project.Clip[0];

  // Check if clip is editable
  if (!isClipEditable(clip)) {
    // Or show a message on the page
    redirect(`/projects/${projectId}`);
  }
  
  const projectTitle = project.displayName ?? "Untitled Project";

  return (
    <div className="w-full flex flex-col gap-6 px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center gap-4">
      <BackButton fallbackHref={`/projects/${projectId}`} confirmOnNavigate={true} />
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
            Edit Clip
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Project: {projectTitle}
          </p>
        </div>
      </div>

      <SingleClipEditor 
        clip={clip}
        projectId={projectId}
        captionsStyle={clip.captionsStyle as Record<string, any> | null}
        hookStyle={clip.hookStyle as Record<string, any> | null}
        projectStyle={project.captionStyle}
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

export default async function EditClipPage({ params }: EditClipPageProps) {
  const { projectId, clipId } = await params;

  return (
    <Suspense fallback={<EditPageSkeleton />}>
      <EditClipPageContent projectId={projectId} clipId={clipId} />
    </Suspense>
  );
}
