"use client";

import { UserButton } from "@clerk/nextjs";
import { Plus, Briefcase, PanelLeftClose, PanelLeftOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const handleProjectsClick = () => {
    router.push("/project");
    setIsMobileMenuOpen(false);
  };

  const handleNewProject = () => {
    router.push("/project");
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-800 bg-[#1a1a1a] px-4 text-white md:hidden">
        <span className="text-base font-medium text-gray-200">OpenSlate</span>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="rounded-md p-2 text-gray-300 hover:bg-[#252525]"
          aria-label="Open navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Menu size={20} />
        </button>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside className="relative flex h-full w-72 flex-col bg-[#1a1a1a] text-white shadow-2xl">
            <div className="flex items-center justify-between p-4">
              <span className="text-lg font-medium text-gray-200">OpenSlate</span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md p-2 text-gray-400 hover:bg-[#252525]"
                aria-label="Close navigation menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-3 pb-3">
              <button onClick={handleNewProject} className="flex w-full items-center gap-3 rounded-lg border border-gray-700 bg-[#252525] p-3 text-left hover:bg-[#2a2a2a]">
                <Plus size={16} className="text-gray-400" />
                <span className="text-gray-200">New project</span>
              </button>
            </div>
            <nav className="px-3">
              <button onClick={handleProjectsClick} className={`flex w-full items-center gap-3 rounded-md p-2 text-sm ${pathname === "/project" ? "border border-gray-700 bg-[#252525] text-gray-200" : "text-gray-400 hover:bg-[#252525] hover:text-gray-200"}`}>
                <Briefcase size={16} />
                Projects
              </button>
            </nav>
            <div className="flex-1" />
            <div className="border-t border-gray-800 p-4"><UserButton /></div>
          </aside>
        </div>
      )}

      <aside
      className={`hidden bg-[#1a1a1a] text-white transition-all duration-300 md:flex md:flex-col ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-lg font-medium text-gray-200">OpenSlate</h1>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-[#252525] rounded-md transition-colors"
        >
          {isCollapsed ? (
            <PanelLeftOpen size={16} className="text-gray-400" />
          ) : (
            <PanelLeftClose size={16} className="text-gray-400" />
          )}
        </button>
      </div>

      {/* New Project Button */}
      <div className="px-3 pb-3">
        <button
          onClick={handleNewProject}
          className={`w-full bg-[#252525] hover:bg-[#2a2a2a] border border-gray-700 hover:border-gray-600 rounded-lg transition-colors flex items-center gap-3 ${
            isCollapsed ? "p-3 justify-center" : "p-3"
          }`}
        >
          <Plus size={16} className="text-gray-400" />
          {!isCollapsed && <span className="text-gray-200">New project</span>}
        </button>
      </div>

      {/* Navigation */}
      {!isCollapsed && (
        <div className="px-3 pb-3">
          <nav className="space-y-1">
            <button
              onClick={handleProjectsClick}
              className={`w-full flex items-center gap-3 p-2 text-sm rounded-md transition-colors ${
                pathname === "/project"
                  ? "bg-[#252525] text-gray-200 border border-gray-700"
                  : "text-gray-400 hover:bg-[#252525] hover:text-gray-200"
              }`}
            >
              <Briefcase size={16} />
              <span>Projects</span>
            </button>
          </nav>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* User Section */}
      <div className="p-3 border-t border-gray-800">
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <UserButton />
          {!isCollapsed && (
            <span className="text-sm text-gray-400">Profile</span>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}
