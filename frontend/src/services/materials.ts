import { apiRequest } from "./api";

export interface MaterialUploadResponse {
  id: number;
  file_id: number;
  filename: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  page_count?: number | null;
  checksum?: string | null;
  processing_status: "pending" | "done" | "failed" | string;
  analysis_status?: "pending" | "done" | "failed" | string;
  routing_tier?: "fast" | "reasoning" | string | null;
  analysis_version?: string | null;
  created_at: string;
  extracted_text?: string | null;
  markdown_twin?: string | null;
  processing_error?: string | null;
  thumbnail_path?: string | null;
}

export interface MaterialUploadEnqueueResponse {
  job_id: number;
  status: string;
  material: MaterialUploadResponse;
}

export interface MaterialUploadBatchResponse {
  materials: MaterialUploadResponse[];
}

export interface MaterialAnalyzeJob {
  job_id: number;
  status: string;
  material: MaterialUploadResponse;
}

export interface MaterialAnalyzeResponse {
  jobs: MaterialAnalyzeJob[];
  total_pages: number;
}

export async function uploadMaterial(file: File): Promise<MaterialUploadEnqueueResponse> {
  const formData = new FormData();
  formData.append("uploaded_file", file);

  const res = await apiRequest(`/materials/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się wgrać materiału");
  }

  return res.json();
}

export async function analyzeMaterials(
  materialIds: number[]
): Promise<MaterialAnalyzeResponse> {
  const res = await apiRequest(`/materials/analyze-deep`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ material_ids: materialIds }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się rozpocząć analizy plików");
  }

  return res.json();
}

export interface MaterialUpdatePayload {
  filename?: string;
}

export async function updateMaterial(
  materialId: number,
  payload: MaterialUpdatePayload
): Promise<MaterialUploadResponse> {
  const res = await apiRequest(`/materials/${materialId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail || "Nie udało się zaktualizować materiału"
    );
  }
  return res.json();
}

export async function deleteMaterial(materialId: number): Promise<void> {
  const res = await apiRequest(`/materials/${materialId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się usunąć materiału");
  }
}

export async function uploadMaterials(files: File[]): Promise<MaterialUploadBatchResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("uploaded_files", file);
  });

  const res = await apiRequest(`/materials/upload-batch`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się wgrać materiałów");
  }

  return res.json();
}

export async function getMaterial(materialId: number): Promise<MaterialUploadResponse> {
  const res = await apiRequest(`/materials/${materialId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się pobrać danych materiału");
  }
  return res.json();
}

export async function listMaterials(): Promise<MaterialUploadResponse[]> {
  const res = await apiRequest(`/materials`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się pobrać listy materiałów");
  }
  return res.json();
}

/** Get blob URL of the file for preview (caller must revoke when done). */
export async function getMaterialFileBlobUrl(materialId: number): Promise<string> {
  const token = localStorage.getItem("access_token");
  const apiBase = import.meta.env.VITE_API_URL || "";
  const url = `${apiBase}/materials/${materialId}/download`;
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Nie udało się załadować pliku");
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/** Trigger download of the original file. Uses auth token. */
export async function downloadMaterial(
  materialId: number,
  filename: string
): Promise<void> {
  const blobUrl = await getMaterialFileBlobUrl(materialId);
  try {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || "material";
    a.click();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
