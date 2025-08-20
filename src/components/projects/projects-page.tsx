"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Film, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { useTransition } from "react";
import { revalidateProjectPages } from "@/actions/revalidate";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "@/lib/utils";

export type ProjectListItem = {
  id: string | number;
  title: string;
  status: string;
  clips: number;
  createdAt: string; // ISO string for serialization
  thumbnail?: string;
  failureReason?: string | null;
};

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "processed":
      return "bg-green-500";
    case "processing":
      return "bg-yellow-500";
    case "queued":
      return "bg-blue-500";
    case "failed":
      return "bg-red-500";
    default:
      return "bg-muted";
  }
}

export default function ProjectsPage({ projects }: { projects: ProjectListItem[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 sm:mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Your Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">{projects.length} total</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(() => revalidateProjectPages())}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="border rounded-xl p-6 text-center text-sm text-muted-foreground">No projects yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-card/70 transition-all duration-300 ease-out transform-gpu hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/20"
              >
                {/* Image background or fallback */}
                {project.thumbnail ? (
                  <Image
                    src={project.thumbnail}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-primary">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.15),transparent_35%)] mix-blend-overlay" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Film className="h-12 w-12 " />
                    </div>
                  </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/25 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Status badge */}
                <div className="absolute top-2 left-2">
                  {project.status === "failed" && project.failureReason ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge className={cn("text-white text-[10px]", getStatusColor(project.status), "hover:brightness-125 cursor-help")}>
                            {project.status}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{project.failureReason}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Badge className={cn("text-white text-[10px]", getStatusColor(project.status))}>
                      {project.status}
                    </Badge>
                  )}
                </div>

                {/* Bottom meta */}
                <div className="absolute inset-x-2 bottom-2">
                  <div className="font-semibold text-white truncate text-sm sm:text-base">{project.title}</div>
                  <div className="text-[11px] text-white/80 truncate">
                    {project.clips} clips • {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
