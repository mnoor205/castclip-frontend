import type React from "react"
export function DashboardFrame({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[2rem] border border-gray-700 bg-gray-900 overflow-hidden">{children}</div>
}
