import { apiRequest } from "./api";

export interface MaterialUploadResponse {
  id: number;
  file_id: number;
  filename: string;
  mime_type?: string | null;
  size_bytes?: number | null;
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

export interface FileExistsResponse {
  exists: boolean;
  file_id: number | null;
  filename: string | null;
}

/**
 * Calculate SHA256 hash of a file
 */
async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

export async function lookupFile(file: File): Promise<FileExistsResponse> {
  const contentHash = await calculateFileHash(file);

  const res = await apiRequest(`/files/lookup-file?content_hash=${contentHash}`, {
    method: "GET",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się sprawdzić pliku");
  }

  return res.json();
}

export async function getMaterialByFile(fileId: number): Promise<MaterialUploadEnqueueResponse> {
  const res = await apiRequest(`/materials/by-file/${fileId}`, {
    method: "GET",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się pobrać materiału");
  }

  return res.json();
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
