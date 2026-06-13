"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { ProjectsGrid } from "@/src/components/projects/ProjectsGrid";
import { CreateProjectModal } from "@/src/components/projects/CreateProjectModal";
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { apiClient } from "@/src/lib/api";
import toast from "react-hot-toast"

function ProjectsPage() {

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
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

      const token = await getToken()

      const result = await apiClient.get("/api/projects", token)

      const {data} = result || {}

      console.log(data, "projectList");

      setProjects(data);

    } catch(err) {
        console.error("Error Loading Projects", err);
        toast.error("Failed to create project")
    } finally {
      setLoading(false)
    }
  };

  useEffect(() =>{
    if(userId) {
      loadProjects();
    }
  }, [userId]);

  const handleCreateProject = async (name: string, description: string) => {}

  const handleDeleteProject = async (projectId:string) => {}

  const handlePojectClick = (projectId: string) => {
    router.push('/projects/${projectd}');
  };

  const handleOpenModal = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };



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

export default ProjectsPage;
