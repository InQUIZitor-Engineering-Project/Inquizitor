import { useEffect, useState, useCallback } from "react";
import { listMaterials, uploadMaterials, deleteMaterial, type MaterialUploadResponse } from "../../../services/materials";

export interface UseLibraryResult {
  materials: MaterialUploadResponse[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  loadMaterials: () => Promise<void>;
  handleUpload: (files: File[]) => Promise<void>;
  handleDelete: (materialId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const useLibrary = (): UseLibraryResult => {
  const [materials, setMaterials] = useState<MaterialUploadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    try {
      setError(null);
      const list = await listMaterials();
      setMaterials(list);
    } catch (err: any) {
      setError(err?.message || "Nie udało się pobrać materiałów");
      console.error("Failed to fetch materials", err);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadMaterials();
  }, [loadMaterials]);

  useEffect(() => {
    loadMaterials().finally(() => setLoading(false));
  }, [loadMaterials]);

  // Polling dla materiałów w trakcie przetwarzania
  useEffect(() => {
    const pendingMaterials = materials.filter(
      (m) => m.processing_status === "pending"
    );
    
    if (pendingMaterials.length === 0) return;

    let cancelled = false;
    let timeoutId: number | null = null;

    const pollMaterials = async () => {
      if (cancelled) return;
      
      try {
        // Odśwież listę materiałów, żeby sprawdzić status
        const updatedList = await listMaterials();
        
        if (cancelled) return;

        // Sprawdź czy są jeszcze pending materiały
        const stillPending = updatedList.filter(
          (m) => m.processing_status === "pending"
        );

        // Zaktualizuj stan (zawsze, nawet jeśli nie ma już pending)
        // To zapewnia, że otrzymamy zaktualizowane dane (np. thumbnail_path)
        setMaterials(updatedList);

        // Kontynuuj polling jeśli są jeszcze pending materiały
        // Ale wykonaj jeszcze jedno odświeżenie po zakończeniu przetwarzania
        if (stillPending.length > 0 && !cancelled) {
          timeoutId = window.setTimeout(pollMaterials, 1000);
        } else if (stillPending.length === 0 && pendingMaterials.length > 0) {
          // Jeśli były pending materiały, ale teraz już nie ma,
          // wykonaj jeszcze jedno odświeżenie po krótkim opóźnieniu
          // żeby upewnić się, że otrzymamy wszystkie zaktualizowane dane
          timeoutId = window.setTimeout(async () => {
            if (cancelled) return;
            try {
              const finalList = await listMaterials();
              if (!cancelled) {
                setMaterials(finalList);
              }
            } catch (err) {
              console.error("Failed to final refresh materials", err);
            }
          }, 500);
        }
      } catch (err) {
        console.error("Failed to poll materials", err);
        if (!cancelled) {
          timeoutId = window.setTimeout(pollMaterials, 1000);
        }
      }
    };

    // Rozpocznij polling po 1s
    timeoutId = window.setTimeout(pollMaterials, 1000);

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [materials]);

  const handleUpload = useCallback(async (files: File[]) => {
    if (!files.length) return;

    try {
      setUploading(true);
      setError(null);
      
      // Upload plików (batch endpoint teraz tworzy joby i odpala celery task)
      await uploadMaterials(files);
      
      // Odśwież listę po udanym uploadzie
      // Polling automatycznie sprawdzi status materiałów co 1s
      await loadMaterials();
    } catch (err: any) {
      setError(err?.message || "Nie udało się wgrać plików");
      console.error("Failed to upload materials", err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [loadMaterials]);

  const handleDelete = useCallback(async (materialId: number) => {
    try {
      setError(null);
      await deleteMaterial(materialId);
      // Odśwież listę po usunięciu
      await loadMaterials();
    } catch (err: any) {
      setError(err?.message || "Nie udało się usunąć materiału");
      console.error("Failed to delete material", err);
      throw err;
    }
  }, [loadMaterials]);

  return {
    materials,
    loading,
    uploading,
    error,
    loadMaterials,
    handleUpload,
    handleDelete,
    refresh,
  };
};

export default useLibrary;

