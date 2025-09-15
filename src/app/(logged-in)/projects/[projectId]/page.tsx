import { prismaDB } from "@/lib/prisma";
import { getUserData } from "@/actions/user";
import { redirect } from "next/navigation";
import { ClipDisplay } from "@/components/projects/clip-display";
import BackButton from "@/components/navigation/back-button";
import DeleteProjectButton from "@/components/projects/delete-project-button";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const user = await getUserData();
  if (!user?.id) {
    redirect("/sign-in");
  }

  const { projectId } = await params;

  const project = await prismaDB.project.findFirst({
    where: {
      id: projectId,
      userId: user.id,
    },
    include: {
      Clip: {
        include: {
          project: {
            select: { captionStyle: true }
          }
        }
      },
    },
  });

  if (!project) {
    redirect("/dashboard");
  }

  const title = project.displayName ?? "Untitled Project";

  const hasClips = project.Clip.length > 0;

  return (
    <div className="w-full flex flex-col gap-8 px-6 py-10">
      <div className="flex items-center justify-between gap-2">
        <BackButton fallbackHref="/projects" />
        <h1 className="flex-1 text-center text-2xl sm:text-3xl font-bold truncate">{title}</h1>
        <div className="flex items-center gap-2">
          <DeleteProjectButton projectId={project.id} />
        </div>
      </div>
      
      {hasClips ? (
        <ClipDisplay clips={project.Clip} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No clips generated yet. Processing may still be in progress.</p>
        </div>
      )}
    </div>
  );
} 