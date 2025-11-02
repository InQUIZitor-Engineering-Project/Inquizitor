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

const API_BASE = import.meta.env.VITE_API_URL || "";

export async function uploadMaterial(file: File): Promise<MaterialUploadResponse> {
  const token = localStorage.getItem("access_token");
  const formData = new FormData();
  formData.append("uploaded_file", file);

  const res = await fetch(`${API_BASE}/materials/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się wgrać materiału");
  }

  return res.json();
}
