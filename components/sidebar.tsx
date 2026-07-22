"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    List,
    Folder,
    GitBranch,
    Files,
    ChatCircleDots,
    CaretLeft,
    CaretRight,
} from "@phosphor-icons/react";

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const items = [
    {
        title: "Architecture",
        href: "/analyze/architecture",
        icon: Folder,
        color: "text-violet-400",
    },
    {
        title: "Dependency Graph",
        href: "/analyze/graph",
        icon: GitBranch,
        color: "text-sky-400",
    },
    {
        title: "Documentation",
        href: "/analyze/docs",
        icon: Files,
        color: "text-orange-400",
    },
    {
        title: "AI Chat",
        href: "/analyze/chat",
        icon: ChatCircleDots,
        color: "text-emerald-400",
    },
];

export default function Sidebar({
    collapsed,
    onToggle,
}: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={`relative flex h-screen flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ${collapsed ? "w-20" : "w-72"
                }`}
        >
            {/* Header */}

            <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-5">
                {!collapsed && (
                    <h1 className="text-lg font-semibold tracking-wide text-white">
                        REPLORE
                    </h1>
                )}

                <button
                    onClick={onToggle}
                    className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                >
                    {collapsed ? (
                        <CaretRight size={18} weight="bold" />
                    ) : (
                        <CaretLeft size={18} weight="bold" />
                    )}
                </button>
            </div>

            {/* Navigation */}

            <nav className="mt-4 flex-1 px-3">
                <div className="space-y-2">
                    {items.map(({ title, href, icon: Icon, color }) => {
                        const active = pathname === href;

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`group flex items-center rounded-xl px-3 py-3 transition-all

                ${active
                                        ? "bg-zinc-900"
                                        : "hover:bg-zinc-900/70"
                                    }`}
                            >
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 ${color}`}
                                >
                                    <Icon size={22} weight="duotone" />
                                </div>

                                {!collapsed && (
                                    <span
                                        className={`ml-4 text-[15px] font-medium ${active
                                                ? "text-white"
                                                : "text-zinc-400 group-hover:text-white"
                                            }`}
                                    >
                                        {title}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

        </aside>
    );
}