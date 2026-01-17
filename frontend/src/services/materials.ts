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
  created_at: string;
  extracted_text?: string | null;
  processing_error?: string | null;
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
  const res = await apiRequest(`/materials/analyze`, {
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
