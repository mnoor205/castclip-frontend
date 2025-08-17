import { getUserData } from "@/actions/user";
import ProjectsPageView, { ProjectListItem } from "@/components/projects/projects-page";
import { prismaDB } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const user = await getUserData();
  if (!user || !user.id) {
    redirect("/sign-in");
  }

  const projects = await prismaDB.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      projects: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          displayName: true,
          status: true,
          createdAt: true,
          thumbnailUrl: true,
          _count: { select: { Clip: true } },
        },
      },
    },
  });

  const items: ProjectListItem[] = projects.projects.map((p) => ({
    id: p.id,
    title: p.displayName || "Unknown filename",
    status: p.status.charAt(0).toUpperCase() + p.status.slice(1),
    clips: p._count.Clip,
    createdAt: p.createdAt.toISOString(),
    thumbnail: p.thumbnailUrl ?? undefined,
  }));

  return <ProjectsPageView projects={items} />;
}