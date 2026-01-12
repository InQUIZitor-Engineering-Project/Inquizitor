import { useMemo, useState } from "react";
import { faqItems as defaultFaqItems } from "../faqData.ts";
import type { FAQItem } from "../faqData.ts";

const useFaq = (items: ReadonlyArray<FAQItem> = defaultFaqItems) => {
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);

  const filteredFaq = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q)
    );
  }, [items, search]);

  const grouped = useMemo(() => {
    const map: Record<string, FAQItem[]> = {};
    for (const item of filteredFaq) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [filteredFaq]);

  const handleToggle = (id: number) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  return {
    search,
    setSearch,
    activeId,
    setActiveId,
    filteredFaq,
    grouped,
    handleToggle,
  };
};

export default useFaq;
