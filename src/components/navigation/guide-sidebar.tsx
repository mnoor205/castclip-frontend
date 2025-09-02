"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarItems = [
  {
    section: "INTRODUCTION",
    items: [
      {
        title: "Introduction",
        slug: "intro",
        description: "An overview of the guide and what you’ll learn.",
      },
    ],
  },
  {
    section: "STEPS",
    items: [
      {
        title: "Step 1: Account Creation",
        slug: "step-1",
        description: "How to properly set up a new social media account.",
      },
      {
        title: "Step 2: Account Warm Up",
        slug: "step-2",
        description: "Warming up new accounts to avoid restrictions.",
      },
      {
        title: "Step 3: Posting",
        slug: "step-3",
        description: "Strategies for consistent, engaging posting.",
      },
    ],
  },
];

type GuideSidebarProps = {
  inSheet?: boolean;
};

export default function GuideSidebar({ inSheet = false }: GuideSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`w-72 p-4 flex flex-col h-full ${inSheet ? "border-0" : "border-r"}`}>
      <h1 className="text-2xl font-bold">Growth Guide</h1>
      <p className="text-md text-gray-500">Brought to You By CastClip</p>

      <nav className="mt-6 space-y-6">
        {sidebarItems.map((section) => (
          <div key={section.section}>
            <h2 className="text-sm font-semibold text-gray-600 mb-3">
              {section.section}
            </h2>
            <ul className="space-y-3">
              {section.items.map((item) => {
                const href = item.slug ? (item.slug === "intro" ? `/guide` : `/guide/${item.slug}`) : `/guide`;
                const isActive = pathname === href;
                return (
                  <li key={item.slug}>
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={
                        `block p-4 rounded-xl border transition ` +
                        (isActive
                          ? "bg-primary/20 border-primary shadow-sm"
                          : "hover:bg-primary/20 hover:shadow-md")
                      }
                    >
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {item.description}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}


