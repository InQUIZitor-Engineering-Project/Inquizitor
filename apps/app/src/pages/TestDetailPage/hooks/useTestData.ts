import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { getTestDetail, deleteTest, type TestDetail } from "../../../services/test";

type LayoutCtx = { refreshSidebarTests: () => Promise<void> };

export interface UseTestDataResult {
  data: TestDetail | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  deleteCurrent: (id: number) => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<TestDetail | null>>;
}

const useTestData = (): UseTestDataResult => {
  const { testId } = useParams<{ testId: string }>();
  const testIdNum = Number(testId);
  const navigate = useNavigate();
  const context = useOutletContext<LayoutCtx | null>();
  const refreshSidebarTests = context?.refreshSidebarTests || (async () => {});
  // const { refreshSidebarTests } = useOutletContext<LayoutCtx>();

  const [data, setData] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) return;
    const id = Number(testId);
    if (!Number.isFinite(id)) {
      setError("Nieprawidłowe ID testu");
      setLoading(false);
      return;
    }
    getTestDetail(id)
      .then((detail) => {
        setData(detail);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [testId]);

  const refresh = async () => {
    if (!testIdNum) return;
    const detail = await getTestDetail(testIdNum);
    setData(detail);
  };

  const deleteCurrent = async (id: number) => {
    await deleteTest(id);
    await refreshSidebarTests();
    navigate("/dashboard");
  };

  return { data, loading, error, refresh, deleteCurrent, setData };
};

export default useTestData;
