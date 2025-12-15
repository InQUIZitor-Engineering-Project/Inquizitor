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
