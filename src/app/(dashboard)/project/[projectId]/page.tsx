"use client";

import React, { use, useState } from 'react'
import { ConversationsList } from '@/src/components/projects/ConversationsList';
import { KnowledgeBaseSidebar } from '@/src/components/projects/KnowledgeBaseSidebar';
import { FileDetailsModal } from '@/src/components/projects/FileDetailsModal';

interface ProjectDetailsPageProps {
  params: Promise <{
    projectId: string;
  }>;
}

function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { projectId } = use(params);
  
  const [activateTab, setActivateTab] = useState<"documents" | "settings">(
    "documents"
  );

  const [selectDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );

  //Mock data for static UI
  const mockProject = {
    id: projectId,
    name: "Research Analysis Project",
    description: "AI and machine learning research papers",
    created_at: new Date().toISOString(),
    clerk_id: "user_123",
  };

  const mockChats = [
    {
      id: "chat_1",
      project_id: projectId,
      title: "Chat #1234",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      clerk_id: "user_123",
    },
    {
      id: "chat_2",
      project_id: projectId,
      title: "Chat #5678",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      clerk_id: "user_123",
    },
  ];

  const mockDocuments = [
    {
      id: "doc_1",
      project_id: projectId,
      filename: "research_paper.pdf",
      s3_key: "projects/123/documents/research_paper.pdf",
      file_size: 2457600,
      file_type: "application/pdf",
      processing_status: "completed",
      clerk_id: "user_123",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      source_type: "file",
      processing_details: {},
    },
  ];

  const mockSettings = {
    id: "settings_1",
    project_id: projectId,
    embedding_model: "text-embedding-3-large",
    rag_strategy: "basic",
    agent_type: "agentic",
    chunks_per_search: 10,
    final_context_size: 5,
    similarity_threshold: 0.3,
    number_of_queries: 5,
    reranking_enabled: true,
    reranking_model: "rerank-english-v3.0",
    vector_weight: 0.7,
    keyword_weight: 0.3,
    created_at: new Date().toISOString(),
  };

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


  return (
    <div>This ProjectPage</div>
  )
}

export default ProjectDetailsPage;