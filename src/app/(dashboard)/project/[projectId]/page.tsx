"use client";

import { useState, useEffect } from 'react';
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

// ONLY LOG
// ==========
  const handleChatClick = (chatId: string) => {
    console.log("Navigate to chat:", chatId);
  };

  const handleOpenDocument = (documentId: string) => {
    console.log("Open document", documentId);
    setSelectedDocumentId(documentId);
  };  
// ==========

  const handleDocumentDelete = async (documentId: string) => {
    if (!userId) return;
    try {
      const token = await getToken() 
      await apiClient.delete(
        `/api/projects/${projectId}/files/${documentId}`, token
    );

  setData((prev) => ({
    ...prev,
    documents: prev.documents.filter((doc) => doc.id !== documentId)
  }));

  toast.success("Document deleted")
} catch (arr) {
  toast.error("Document delete failed")
}
  };

  const handleUrlAdd = async (url: string) => {
    if (!userId) return;

    try {
      const token = await getToken();

      const result = await apiClient.post(
        `/api/projects/${projectId}/urls`,
        {
          url,
        },
        token
      );
      const newDocument = result.data

      setData((prev) => ({
        ...prev,
        documents: [newDocument, ...prev.documents],
      }));
      toast.success("Website added successfully!");
    } catch (err) {
      toast.error("Failed to add website");
    }
  };

  const handleCreateNewChat = async () => {
    if (!userId) return;

    try {
      setIsCreatingChat(true);

      const token = await getToken();

      const chatNumber = Date.now() % 10000;

      const result = await apiClient.post(
        "/api/chats",
        {
          title: `Chat #${chatNumber}`,
          project_id: projectId,
        },
        token
      );

      const savedChat = result.data;

      // Update local state
      setData((prev) => ({
        ...prev,
        chats: [savedChat, ...prev.chats],
      }));

      toast.success("Chat Created successfully");
    } catch (err) {
      toast.error("Failed to create chat");
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!userId) return;

    try {
      const token = await getToken();

      await apiClient.delete(`/api/chats/${chatId}`, token);

      // Update local state
      setData((prev) => ({
        ...prev,
        chats: prev.chats.filter((chat) => chat.id !== chatId),
      }));

      toast.success("Chat deleted successfully");
    } catch (err) {
      toast.error("Failed to delete chat");
    }
  };

  const handleDocumentUpload = async (files: File[]) => {
    if (!userId) return;

    const token = await getToken();
    const uploadedDocuments: ProjectDocument[] = [];

    const uploadPromises = files.map(async (file) => {
      try {
        const uploadData = await apiClient.post(
          `/api/projects/${projectId}/files/upload-url`,
          {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
          },
          token
        );
        const { upload_url, s3_key } = uploadData.data;

        await apiClient.uploadToS3(upload_url, file);

        const updatedDocument = await apiClient.post(
          `/api/projects/${projectId}/files/confirm`,
          {s3_key}, 
          token 
        );
        
        uploadedDocuments.push(updatedDocument.data);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`)
      }
    });

    await Promise.allSettled(uploadPromises)

    if (uploadedDocuments.length > 0) {
      setData((prev) => ({
        ...prev,
        documents: [...uploadedDocuments, ...prev.documents]
      }));

      toast.success(`${uploadedDocuments.length} file(s) uploaded`);
    }
  };

  const handleDraftSettings = (updates: Partial<ProjectSettings>) => {
    setData((prev) => {
      // If no settings exist yet, we can't update them
      if (!prev.settings) {
        console.warn("Cannot update settings: not loaded yet");
        return prev;
      }

      // Merge the updates into existing settings
      return {
        ...prev,
        settings: {
          ...prev.settings,
          ...updates,
        },
      };
    });
  };

  const handlePublishSettings = async () => {
    if (!userId || !data.settings) {
      toast.error("Cannot save settings");
      return;
    }

    try {
      const token = await getToken();

      const result = await apiClient.put(
        `/api/projects/${projectId}/settings`,
        data.settings,
        token
      );

      setData((prev) => ({
        ...prev,
        settings: result.data,
      }));

      toast.success("Settings saved successfully!");
    } catch (err) {
      toast.error("Failed to save settings!");
    }
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
