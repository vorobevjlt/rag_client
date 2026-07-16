"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { ProjectsGrid } from "@/src/components/projects/ProjectsGrid";
import { CreateProjectModal } from "@/src/components/projects/CreateProjectModal";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { apiClient } from "@/src/lib/api";
import { Project } from "@/src/lib/types";
import toast from "react-hot-toast"



function ProjectMainPage() {

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const[searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { getToken, userId } = useAuth();
  const router = useRouter();

  const loadProjects = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const result = await apiClient.get("/api/projects", token);

      const { data } = result || {};

      console.log(data, "projectList")

      setProjects(data);
    } catch (err) {
      console.error("Error Loading Projects", err);
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (name: string, description: string) => {
    try {
      setError(null);
      setIsCreating(true);

      const token = await getToken();

      const result = await apiClient.post(
        "/api/projects",
        {
          name,
          description,
        },
        token
      );

      const savedProject = result?.data || {};
      setProjects((prev) => [savedProject, ...prev]);

      setShowCreateModal(false);
      toast.success("Project created successfully!");
    } catch (err) {  
      toast.error("Failed to create project");
      console.error("Failed to create project", err);
    } finally {
      setIsCreating(false);
    }

  };

  const handleDeleteProject = async (projectId:string) => {
    try{
      setError(null);
      const token = await getToken();

      await apiClient.delete(
        `/api/projects/${projectId}`,
        token
      );

      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      toast.success("Project deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete project");
      console.error("Failed to delete project", err);
    }
  }

  const handlePojectClick = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  const handleOpenModal = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  useEffect(() => {
    if (userId) {
      loadProjects();
    }
  }, [userId])
  
  const filterProjects = projects.filter(
    (project) => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner message="Loading...." />
  }

  return (
    <div>
      <ProjectsGrid
        projects={projects}
        loading={loading}
        error={error}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onProjectClick={handlePojectClick}
        onCreateProject={handleOpenModal}
        onDeleteProject={handleDeleteProject}
      />
      
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onCreateProject={handleCreateProject}
        isLoading={isCreating}
      />
    </div>
  );
}

export default ProjectMainPage;
