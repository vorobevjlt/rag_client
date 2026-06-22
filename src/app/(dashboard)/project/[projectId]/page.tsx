"use client";

import React, { useState, useEffect } from 'react';
import { ConversationsList } from '@/src/components/projects/ConversationsList';
import { KnowledgeBaseSidebar } from '@/src/components/projects/KnowledgeBaseSidebar';
import { FileDetailsModal } from '@/src/components/projects/FileDetailsModal';
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { NotFound } from "@/src/components/ui/NotFound";
import { useAuth } from "@clerk/nextjs"
import { apiClient } from '@/src/lib/api';
import toast from "react-hot-toast"
import { useParams } from "next/navigation";
import { Project, Chat, ProjectDocument, ProjectSettings } from "@/src/lib/types";

interface ProjectData {
  project: Project | null;
  chats: Chat[];
  documents: ProjectDocument[];
  settings: ProjectSettings | null;
}

function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { getToken, userId } = useAuth();
  const [ data, setData ] = useState<ProjectData>({
    project: null,
    chats: [],
    documents: [],
    settings: null
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const [activateTab, setActivateTab] = useState<"documents" | "settings">(
    "documents"
  );

  const [selectDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const loadAllData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        const token = await getToken();

        const [projectRes, chatsRes, documentsRes, settingsRes] =
          await Promise.all([
            apiClient.get(`/api/projects/${projectId}`, token),
            apiClient.get(`/api/projects/${projectId}/chats`, token),
            apiClient.get(`/api/projects/${projectId}/files`, token),
            apiClient.get(`/api/projects/${projectId}/settings`, token),
          ]);

        setData({
          project: projectRes.data,
          chats: chatsRes.data,
          documents: documentsRes.data,
          settings: settingsRes.data,
        });
      } catch (err) {
        setError("Failed to fetch data");
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [userId, projectId, getToken]);

  //   Chat-related methods
  const handleCreateNewChat = async () => {
    console.log("Create new Chat");
  };

  const handleDeleteChat = async (chatId: string) => {
    console.log("Chat Deleted");
  };

  const handleChatClick = (chatId: string) => {
    console.log("Navigate to chat:", chatId);
  };

  //   Document-related methods
  const handleDocumentUpload = async (files: File[]) => {
    console.log("Upload files", files);
  };

  const handleDocumentDelete = async (documentId: string) => {
    console.log("Document Deleted");
  };

  const handleUrlAdd = async (url: string) => {
    console.log("Add URL", url);
  };

  const handleOpenDocument = (documentId: string) => {
    console.log("Open document", documentId);
    setSelectedDocumentId(documentId);
  };

  // Project settings

  const handleDraftSettings = (updates: any) => {
    console.log("Update local state with draft settings", updates);
  };

  const handlePublishSettings = async () => {
    console.log("Make API call to publish settings");
  };

  if (loading) {
    return <LoadingSpinner message="Loading project..." />;
  }

  if (!data.project) {
    return <NotFound message="Project not found" />;
  }

  const selectedDocument = selectDocumentId
    ? data.documents.find((doc) => doc.id == selectDocumentId)
    : null;
  return  (
  <div>
    <div className='flex h-screen bg-[#0d1117] p-4'>
      <ConversationsList 
        project={data.project}
        conversations={data.chats}
        error={error}
        loading={isCreatingChat}
        onCreateNewChat={handleCreateNewChat}
        onChatClick={handleChatClick}
        onDeleteChat={handleDeleteChat} 
        />
      
        <KnowledgeBaseSidebar 
          activeTab={activateTab}
          onSetActiveTab={setActivateTab}
          projectDocuments={data.documents}
          onDocumentUpload={handleDocumentUpload}
          onDocumentDelete={handleDocumentDelete}
          onOpenDocument={handleOpenDocument}
          onUrlAdd={handleUrlAdd}
          projectSettings={data.settings}
          settingsError={null}
          settingsLoading={false}
          onUpdateSettings={handleDraftSettings}
          onApplySettings={handlePublishSettings} 
          />
      </div>      
      {selectedDocument && (
        <FileDetailsModal
          document={selectedDocument}
          onClose={() => setSelectedDocumentId(null)}
        />
      )}
  </div>);
}

export default ProjectDetailsPage;