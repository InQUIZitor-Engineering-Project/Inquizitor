import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  getTestDetail,
  deleteTest,
  type TestDetail,
  type QuestionOut,
} from "../../../services/test";

type LayoutCtx = { refreshSidebarTests: () => Promise<void> };

const difficultyOrder: Record<number, number> = { 1: 0, 2: 1, 3: 2 };

const sortQuestions = (qs: QuestionOut[]) =>
  [...qs].sort((a, b) => {
    const oa = difficultyOrder[a.difficulty] ?? 99;
    const ob = difficultyOrder[b.difficulty] ?? 99;
    if (oa !== ob) return oa - ob;
    return (a.id || 0) - (b.id || 0);
  });

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
  const { refreshSidebarTests } = useOutletContext<LayoutCtx>();

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
        setData({ ...detail, questions: sortQuestions(detail.questions) });
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [testId]);

  const refresh = async () => {
    if (!testIdNum) return;
    const detail = await getTestDetail(testIdNum);
    setData({ ...detail, questions: sortQuestions(detail.questions) });
  };

  const deleteCurrent = async (id: number) => {
    await deleteTest(id);
    await refreshSidebarTests();
    navigate("/dashboard");
  };

  return { data, loading, error, refresh, deleteCurrent, setData };
};

export { sortQuestions };
export default useTestData;
