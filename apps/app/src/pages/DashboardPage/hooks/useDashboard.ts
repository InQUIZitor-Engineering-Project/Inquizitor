import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteTest, getMyTests } from "../../../services/test";
import type { TestOut } from "../../../services/test";

export interface UseDashboardResult {
  tests: TestOut[];
  loading: boolean;
  testIdToDelete: number | null;
  refresh: () => Promise<void>;
  openDeleteModal: (id: number) => void;
  closeDeleteModal: () => void;
  confirmDelete: () => Promise<void>;
}

const useDashboard = (): UseDashboardResult => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [testIdToDelete, setTestIdToDelete] = useState<number | null>(null);

  const refresh = async () => {
    const list = await getMyTests();
    setTests(list);
  };

  useEffect(() => {
    refresh().catch((e) => console.error("Failed to fetch tests", e)).finally(() => setLoading(false));
  }, []);

  const openDeleteModal = (id: number) => setTestIdToDelete(id);
  const closeDeleteModal = () => setTestIdToDelete(null);

  const confirmDelete = async () => {
    if (testIdToDelete == null) return;
    try {
      await deleteTest(testIdToDelete);
      await refresh();
      navigate("/dashboard");
    } catch (err: any) {
      alert("Nie udało się usunąć testu: " + (err?.message || err));
    } finally {
      closeDeleteModal();
    }
  };

  return {
    tests,
    loading,
    testIdToDelete,
    refresh,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  };
};

export default useDashboard;
