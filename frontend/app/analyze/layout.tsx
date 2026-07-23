"use client";

import { useState } from "react";
import Sidebar from "@/frontend/components/sidebar";

export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}