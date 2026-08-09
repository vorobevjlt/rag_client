"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/src/lib/api";
import { ProjectDocument } from "@/src//lib/types";
import { GenericStep } from "./document-details/GenericStep";
import { PartitioningStep } from "./document-details/PartitioningStep";
import { ChunkingStep } from "./document-details/ChunkingStep";
import { SummarisingStep } from "./document-details/SummarisingStep";
import { ChunksViewer } from "./document-details/ChunksViewer";
import { PipelineTabs } from "./document-details/PipelineTabs";
import { DetailInspector } from "./document-details/DetailInspector";
import { ModalHeader } from "./document-details/ModalHeader";
import { Modal } from "./document-details/Modal";

interface FileDetailsModalProps {
  document: ProjectDocument;
  onClose: () => void;
}

interface ProcessingDetails {
  error?: { message?: string };
  partitioning?: {
    elements_found?: {
      text: number;
      tables: number;
      images: number;
      titles: number;
      other: number;
    };
  };
  chunking?: { total_chunks: number };
  summarising?: { current_chunk: number; total_chunks: number };
}

interface ApiDocumentChunk {
  id: string;
  type: string[];
  content: string;
  original_content: Record<string, unknown>;
  page_number: number | null;
  chunk_index: number;
  char_count: number;
}

interface DocumentChunk {
  id: string;
  type: string[];
  content: string;
  original_content: Record<string, unknown>;
  page: number | null;
  chunkIndex: number;
  chars: number;
}

const PIPELINE_STEPS = [
  {
    id: "uploading",
    name: "Upload to S3",
    description: "Uploading file to secure cloud storage",
  },
  {
    id: "queued",
    name: "Queued",
    description: "File queued for processing",
  },
  {
    id: "processing",
    name: "Starting",
    description: "Preparing the document processing job",
  },
  {
    id: "partitioning",
    name: "Partitioning",
    description: "Processing and extracting text, images, and tables",
  },
  {
    id: "chunking",
    name: "Chunking",
    description: "Creating semantic chunks",
  },
  {
    id: "summarising",
    name: "Summarisation",
    description: "Enhancing content with AI summaries for images and tables",
  },
  {
    id: "vectorization",
    name: "Vectorization & Storage",
    description: "Generating embeddings and storing in vector database",
  },
  {
    id: "completed",
    name: "View Chunks",
    description: "View processed document chunks",
  },
];

export function FileDetailsModal({ document, onClose }: FileDetailsModalProps) {
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const { getToken, userId } = useAuth();

  const [selectedChunk, setSelectedChunk] = useState<DocumentChunk | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[] | null>(null);

  const currentStatus =
    document.processing_status === "pending"
      ? "uploading"
      : document.processing_status || "uploading";
  const isProcessingComplete = currentStatus === "completed";
  const isProcessingFailed = currentStatus === "failed";
  const processingDetails = document.processing_details as ProcessingDetails;
  const failureMessage =
    processingDetails?.error?.message ||
    "Processing failed. Retry the document from the Sources list.";
  const visiblePipelineSteps = isProcessingFailed
    ? [
        ...PIPELINE_STEPS,
        {
          id: "failed",
          name: "Failed",
          description: failureMessage,
        },
      ]
    : PIPELINE_STEPS;
  const activeTab = selectedTab ?? currentStatus;
  const currentStep = visiblePipelineSteps.find((s) => s.id === activeTab);
  const chunksLoading = isProcessingComplete && chunks === null;

  const getStepStatus = (stepId: string) => {
    if (stepId === "failed" && isProcessingFailed) return "failed";
    const currentPos = PIPELINE_STEPS.findIndex(
      (step) => step.id === currentStatus
    );
    const stepPos = PIPELINE_STEPS.findIndex(
      (step) => step.id === stepId);

    if (stepPos < currentPos) return "completed";
    if (stepPos === currentPos) return "processing";
    return "pending";
  };

  useEffect(() => {
    if (!isProcessingComplete || !userId) return;
    let cancelled = false;

    getToken()
      .then((token) =>
        apiClient.get(
          `/api/projects/${document.project_id}/files/${document.id}/chunks`,
          token
        )
      )
      .then((result) => {
        if (cancelled) return;
        setChunks(
          (result.data as ApiDocumentChunk[]).map((chunk) => ({
            id: chunk.id,
            type: chunk.type,
            content: chunk.content,
            original_content: chunk.original_content,
            page: chunk.page_number,
            chunkIndex: chunk.chunk_index,
            chars: chunk.char_count,
          }))
        );
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Error loading chunks:", error);
        setChunks([]);
      });

    return () => {
      cancelled = true;
    };
  }, [document.id, document.project_id, getToken, isProcessingComplete, userId]);

  return (
    <Modal onClose={onClose}>
      <ModalHeader document={document} onClose={onClose} />

      <PipelineTabs
        activeTab={activeTab}
        onTabChange={setSelectedTab}
        tabs={visiblePipelineSteps.map((step) => ({
          id: step.id,
          name: step.name,
          enabled:
            step.id === "completed"
              ? isProcessingComplete
              : step.id === "failed" || getStepStatus(step.id) !== "pending",
          icon: <div></div>,
        }))}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-[#1a1a1a]">
          {/* Show Chunks Viewer if completed */}
          {activeTab === "completed" && isProcessingComplete && (
            <ChunksViewer
              chunks={chunks ?? []}
              chunksLoading={chunksLoading}
              selectedChunk={selectedChunk}
              onSelectChunk={setSelectedChunk}
            />
          )}

          {/* Show Partitioning Step */}
          {activeTab === "partitioning" && (
            <PartitioningStep
              status={getStepStatus("partitioning")}
              elementsFound={processingDetails?.partitioning?.elements_found}
            />
          )}

          {/* Show Chunking Step */}
          {activeTab === "chunking" && (
            <ChunkingStep
              status={getStepStatus("chunking")}
              chunkingData={processingDetails?.chunking}
              chunks={chunks ?? []}
              partitioningData={processingDetails?.partitioning}
            />
          )}

          {/* Show Summarising Step */}
          {activeTab === "summarising" && (
            <SummarisingStep
              status={getStepStatus("summarising")}
              summarisingData={processingDetails?.summarising}
            />
          )}

          {/* Show Generic Steps for other steps */}
          {!["completed", "partitioning", "chunking", "summarising"].includes(
            activeTab
          ) && (
            <GenericStep
              stepName={currentStep?.name || "Processing"}
              description={currentStep?.description || "Processing step"}
              status={
                activeTab === "failed" ? "failed" : getStepStatus(activeTab)
              }
            />
          )}
        </div>

        {/* Detail Inspector */}
        <DetailInspector
          selectedChunk={selectedChunk}
          isProcessingComplete={isProcessingComplete}
        />
      </div>
    </Modal>
  );
}
