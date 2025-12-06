import { useState } from "react";
import { updateTestTitle } from "../../../services/test";
import type { TestDetail } from "../../../services/test";
import { useLoader } from "../../../components/Loader/GlobalLoader";

export interface UseTitleEditResult {
  state: {
    isEditingTitle: boolean;
    titleDraft: string;
  };
  actions: {
    begin: (title: string) => void;
    change: (value: string) => void;
    cancel: (current?: string) => void;
    save: (test: TestDetail | null, refreshSidebar: () => Promise<void>, setData: (next: TestDetail | null) => void) => Promise<void>;
  };
}

const useTitleEdit = (): UseTitleEditResult => {
  const { withLoader } = useLoader();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const begin = (title: string) => {
    setTitleDraft(title || "");
    setIsEditingTitle(true);
  };

  const change = (value: string) => setTitleDraft(value);

  const cancel = (current?: string) => {
    setTitleDraft(current || "");
    setIsEditingTitle(false);
  };

  const save = async (
    test: TestDetail | null,
    refreshSidebar: () => Promise<void>,
    setData: (next: TestDetail | null) => void
  ) => {
    if (!test) return;
    const next = titleDraft.trim();
    if (!next) {
      alert("Tytuł nie może być pusty");
      return;
    }
    try {
      await withLoader(async () => {
        const updated = await updateTestTitle(test.test_id, next);
        setData(test ? { ...test, title: updated.title } : test);
        setIsEditingTitle(false);
        await refreshSidebar();
      });
    } catch (e: any) {
      alert(e.message || "Nie udało się zaktualizować tytułu");
    }
  };

  return {
    state: { isEditingTitle, titleDraft },
    actions: { begin, change, cancel, save },
  };
};

export default useTitleEdit;
