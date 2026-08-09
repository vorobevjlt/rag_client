"use client";

import { useState, useEffect, useRef } from 'react';
import { ConversationsList } from '@/src/components/projects/ConversationsList';
import { KnowledgeBaseSidebar } from '@/src/components/projects/KnowledgeBaseSidebar';
import { FileDetailsModal } from '@/src/components/projects/FileDetailsModal';
import { LoadingSpinner } from "@/src/components/ui/LoadingSpinner";
import { NotFound } from "@/src/components/ui/NotFound";
import { useAuth } from "@clerk/nextjs"
import { ApiError, apiClient } from '@/src/lib/api';
import toast from "react-hot-toast"
import { useParams, useRouter } from "next/navigation";
import {
  Project,
  Chat,
  ProjectDocument,
  ProjectSettings,
  UploadQueueItem,
} from "@/src/lib/types";

const MAX_CONCURRENT_UPLOADS = 3;

interface ProjectData {
  project: Project | null;
  chats: Chat[];
  documents: ProjectDocument[];
  settings: ProjectSettings | null;
}

function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
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
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const uploadControllers = useRef<Map<string, AbortController>>(new Map());
  const uploadFiles = useRef<Map<string, File>>(new Map());
  const cancelledUploadIds = useRef<Set<string>>(new Set());
  const nextUploadId = useRef(0);
  const uploadBatchActive = useRef(false);

  useEffect(() => {
    const controllers = uploadControllers.current;
    return () => {
      for (const controller of controllers.values()) {
        controller.abort();
      }
    };
  }, []);

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
      } catch {
        setError("Failed to fetch data");
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [userId, projectId, getToken]);

  useEffect(() => {
    const hasProcessingDocuments = data.documents.some(
      (doc) =>
        doc.processing_status &&
        !["completed", "failed"].includes(doc.processing_status)
    );

    if (!hasProcessingDocuments) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const token = await getToken();
        const documentsRes = await apiClient.get(
          `/api/projects/${projectId}/files`,
          token
        );

        setData((prev) => ({
          ...prev,
          documents: documentsRes.data,
        }));
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [data.documents, projectId, getToken]);

  const handleChatClick = (chatId: string) => {
    router.push(`/project/${projectId}/chats/${chatId}`);
  };

  const handleOpenDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
  };

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
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Document delete failed";
  toast.error(message)
}
  };

  const handleDocumentRetry = async (documentId: string) => {
    if (!userId) return;
    try {
      const token = await getToken();
      const result = await apiClient.post(
        `/api/projects/${projectId}/files/${documentId}/retry`,
        {},
        token
      );
      const retriedDocument = result.data as ProjectDocument;
      setData((previous) => ({
        ...previous,
        documents: previous.documents.map((document) =>
          document.id === documentId ? retriedDocument : document
        ),
      }));
      toast.success("Document processing queued again");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Document retry failed";
      toast.error(message);
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
      const message = err instanceof Error ? err.message : "Failed to add website";
      toast.error(message);
      throw err;
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
      // router.push(`/project/${projectId}/chats/${savedChat.id}`);
      // Update local state
      setData((prev) => ({
        ...prev,
        chats: [savedChat, ...prev.chats],
      }));

      toast.success("Chat Created successfully");
    } catch {
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
    } catch {
      toast.error("Failed to delete chat");
    }
  };

  const handleDocumentUpload = async (files: File[]) => {
    if (!userId) return;
    if (uploadBatchActive.current) {
      toast.error("Please wait for the current upload batch to finish");
      return;
    }
    uploadBatchActive.current = true;

    try {
      const knownFiles = new Set(
        data.documents
          .filter(
            (document) =>
              document.source_type === "file" &&
              document.processing_status !== "failed"
          )
          .map((document) => `${document.filename}:${document.file_size}`)
      );
      for (const item of uploadQueue) {
        if (!["failed", "cancelled", "completed"].includes(item.status)) {
          knownFiles.add(`${item.filename}:${item.fileSize}`);
        }
      }

      const queuedUploads: Array<{ item: UploadQueueItem; file: File }> = [];
      for (const file of files) {
        const duplicateKey = `${file.name}:${file.size}`;
        if (knownFiles.has(duplicateKey)) {
          toast.error(`${file.name} is already in this project or upload queue`);
          continue;
        }
        knownFiles.add(duplicateKey);

        nextUploadId.current += 1;
        const id = `upload-${nextUploadId.current}`;
        const item: UploadQueueItem = {
          id,
          filename: file.name,
          fileSize: file.size,
          progress: 0,
          status: "waiting",
        };
        uploadFiles.current.set(id, file);
        queuedUploads.push({ item, file });
      }

      if (queuedUploads.length === 0) return;
      setUploadQueue((previous) => [
        ...queuedUploads.map(({ item }) => item),
        ...previous,
      ]);

      let nextUpload = 0;
      const worker = async () => {
        while (nextUpload < queuedUploads.length) {
          const current = queuedUploads[nextUpload++];
          await runDocumentUpload(current.item.id, current.file);
        }
      };

      await Promise.all(
        Array.from(
          { length: Math.min(MAX_CONCURRENT_UPLOADS, queuedUploads.length) },
          () => worker()
        )
      );
    } finally {
      uploadBatchActive.current = false;
    }
  };

  const updateUpload = (
    uploadId: string,
    updates: Partial<UploadQueueItem>
  ) => {
    setUploadQueue((previous) =>
      previous.map((item) =>
        item.id === uploadId ? { ...item, ...updates } : item
      )
    );
  };

  const upsertDocument = (document: ProjectDocument) => {
    setData((previous) => ({
      ...previous,
      documents: [
        document,
        ...previous.documents.filter((item) => item.id !== document.id),
      ],
    }));
  };

  const removeLocalDocument = (documentId: string) => {
    setData((previous) => ({
      ...previous,
      documents: previous.documents.filter((item) => item.id !== documentId),
    }));
  };

  const runDocumentUpload = async (
    uploadId: string,
    file: File,
    existingS3Key?: string,
    existingDocumentId?: string
  ) => {
    if (cancelledUploadIds.current.has(uploadId)) return;
    const controller = new AbortController();
    uploadControllers.current.set(uploadId, controller);

    let documentId = existingDocumentId;
    let s3Key = existingS3Key;
    let confirmationStarted = Boolean(existingS3Key);

    try {
      const token = await getToken();
      if (!token) throw new Error("Your session has expired. Please sign in again.");

      if (!s3Key) {
        updateUpload(uploadId, {
          status: "preparing",
          progress: 0,
          error: undefined,
          retryMode: undefined,
          s3Key: undefined,
          documentId: undefined,
        });
        const uploadData = await apiClient.post(
          `/api/projects/${projectId}/files/upload-url`,
          {
            filename: file.name,
            file_size: file.size,
            file_type: file.type,
          },
          token
        );
        const {
          upload_url,
          s3_key,
          content_type,
          document,
        } = uploadData.data as {
          upload_url: string;
          s3_key: string;
          content_type: string;
          document: ProjectDocument;
        };
        s3Key = s3_key;
        documentId = document.id;
        upsertDocument(document);
        updateUpload(uploadId, {
          status: "uploading",
          s3Key,
          documentId: document.id,
        });

        await apiClient.uploadToS3(
          upload_url,
          file,
          content_type,
          (progress) => updateUpload(uploadId, { progress }),
          controller.signal
        );
      }

      updateUpload(uploadId, { status: "confirming", progress: 100, s3Key });
      confirmationStarted = true;
      const confirmedUpload = await apiClient.post(
        `/api/projects/${projectId}/files/confirm`,
        { s3_key: s3Key },
        token
      );
      upsertDocument(confirmedUpload.data as ProjectDocument);
      updateUpload(uploadId, {
        status: "completed",
        progress: 100,
        error: undefined,
        retryMode: undefined,
      });
      toast.success(`${file.name} uploaded and queued for processing`);
    } catch (error) {
      const wasCancelled =
        error instanceof DOMException && error.name === "AbortError";
      const message =
        error instanceof Error ? error.message : "An unknown upload error occurred";
      const shouldRetryConfirmation =
        confirmationStarted && !(error instanceof ApiError);

      if (documentId && !shouldRetryConfirmation) {
        try {
          const token = await getToken();
          await apiClient.delete(
            `/api/projects/${projectId}/files/${documentId}`,
            token
          );
          removeLocalDocument(documentId);
        } catch (cleanupError) {
          console.error("Failed to clean up incomplete upload:", cleanupError);
        }
      }

      updateUpload(uploadId, {
        status: wasCancelled ? "cancelled" : "failed",
        error: wasCancelled ? "Upload cancelled" : message,
        retryMode: shouldRetryConfirmation ? "confirm" : "restart",
        s3Key: shouldRetryConfirmation ? s3Key : undefined,
        documentId: shouldRetryConfirmation ? documentId : undefined,
      });
      if (!wasCancelled) toast.error(`Failed to upload ${file.name}: ${message}`);
    } finally {
      uploadControllers.current.delete(uploadId);
    }
  };

  const handleCancelUpload = (uploadId: string) => {
    cancelledUploadIds.current.add(uploadId);
    const controller = uploadControllers.current.get(uploadId);
    if (controller) {
      controller.abort();
    } else {
      updateUpload(uploadId, {
        status: "cancelled",
        error: "Upload cancelled",
        retryMode: "restart",
      });
    }
  };

  const handleRetryUpload = async (uploadId: string) => {
    if (uploadBatchActive.current) {
      toast.error("Please wait for the current upload batch to finish");
      return;
    }
    const file = uploadFiles.current.get(uploadId);
    const queueItem = uploadQueue.find((item) => item.id === uploadId);
    if (!file || !queueItem) return;
    cancelledUploadIds.current.delete(uploadId);
    uploadBatchActive.current = true;
    try {
      await runDocumentUpload(
        uploadId,
        file,
        queueItem.retryMode === "confirm" ? queueItem.s3Key : undefined,
        queueItem.retryMode === "confirm" ? queueItem.documentId : undefined
      );
    } finally {
      uploadBatchActive.current = false;
    }
  };

  const handleDismissUpload = (uploadId: string) => {
    uploadFiles.current.delete(uploadId);
    cancelledUploadIds.current.delete(uploadId);
    setUploadQueue((previous) =>
      previous.filter((item) => item.id !== uploadId)
    );
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
    } catch {
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
    <div className='flex min-h-[calc(100dvh-3.5rem)] flex-col gap-4 bg-[#0d1117] p-3 md:h-screen md:flex-row md:p-4'>
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
          uploadQueue={uploadQueue}
          onCancelUpload={handleCancelUpload}
          onRetryUpload={handleRetryUpload}
          onDismissUpload={handleDismissUpload}
          onDocumentDelete={handleDocumentDelete}
          onDocumentRetry={handleDocumentRetry}
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
          key={selectedDocument.id}
          document={selectedDocument}
          onClose={() => setSelectedDocumentId(null)}
        />
      )}
  </div>);
}

export default ProjectDetailsPage;
