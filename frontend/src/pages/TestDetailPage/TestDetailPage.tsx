import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { getMyTests, getTestDetail } from "../../services/test";
import type { TestDetail, TestOut } from "../../services/test";
import Footer from "../../components/Footer/Footer"

import {
  PageWrapper,
  ContentWrapper,
  Header,
  Meta,
  QuestionList,
  QuestionItem,
  ChoiceList,
  ChoiceItem,
} from "./TestDetailPage.styles";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DownloadBar = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const Button = styled.button`
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solidrgb(122, 239, 161);
  background: #4caf4f;
  color:rgb(255, 255, 255);
  cursor: pointer;
`;

function toArray<T = string>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v == null) return [];
  if (typeof v === "string") {
    try {
      const j = JSON.parse(v);
      if (Array.isArray(j)) return j as T[];
    } catch { /* ignore */ }
    return v.trim() ? [v as unknown as T] : [];
  }
  return [v as T];
}

const TestDetailPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const testIdNum = Number(testId);
  const navigate = useNavigate();

  const [data, setData] = useState<TestDetail | null>(null);
  const [tests, setTests] = useState<TestOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("access_token");

  const download = (url: string, filename: string) => {
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((e) => alert(`Nie udało się pobrać pliku: ${e.message}`));
  };

  useEffect(() => {
    if (!testId) return;
    const id = Number(testId);
    if (!Number.isFinite(id)) { setError("Nieprawidłowe ID testu"); return; }
    setLoading(true);
    Promise.all([getTestDetail(Number(testId)), getMyTests()])
      .then(([detail, testsList]) => {
        setData(detail);
        setTests(testsList);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [testId]);

  if (loading) return <PageWrapper>Ładowanie…</PageWrapper>;
  if (error) return <PageWrapper>Błąd: {error}</PageWrapper>;
  if (!data) return null;

  const closedCount = data.questions.filter((q) => q.is_closed).length;
  const openCount = data.questions.length - closedCount;

  return (
    <PageWrapper>
      <Sidebar
        tests={tests}
        onSelect={(testId) => navigate(`/tests/${testId}`)}
        onCreateNew={() => navigate(`/tests/new`)}
      />

      <ContentWrapper>
        <Header>{data.title}</Header>
        <Meta>
          {data.questions.length} pytań |{" "}
          {data.questions.filter((q) => q.difficulty === 1).length} łatwe,{" "}
          {data.questions.filter((q) => q.difficulty === 2).length} średnie,{" "}
          {data.questions.filter((q) => q.difficulty === 3).length} trudne |{" "}
          {closedCount > 0 && openCount > 0
            ? `Mieszane (${closedCount} zamkniętych, ${openCount} otwartych)`
            : closedCount === data.questions.length
            ? "Zamknięte"
            : "Otwarte"}
        </Meta>

        <QuestionList>
          {data.questions.map((q, idx) => (
            <QuestionItem key={q.id}>
              <div className="question-header">
                {idx + 1}. {q.text}
              </div>

              {q.is_closed && (
                <ChoiceList>
                  {toArray(q.choices).map((choice, ci) => {
                    const isCorrect = toArray(q.correct_choices).includes(choice);
                    return (
                      <ChoiceItem key={ci} $correct={isCorrect}>
                        {String.fromCharCode(65 + ci)}. {choice}
                      </ChoiceItem>
                    );
                  })}
                </ChoiceList>
              )}

              {!q.is_closed && (
                <textarea readOnly value="" placeholder="Odpowiedź otwarta…" />
              )}
            </QuestionItem>
          ))}
        </QuestionList>

        <DownloadBar>
          <Button
            onClick={() =>
              download(
                `${API}/tests/${testIdNum}/export/pdf?show_answers=false`,
                `test_${testIdNum}.pdf`
              )
            }
          >
            Pobierz PDF
          </Button>
          <Button
            onClick={() =>
              download(`${API}/tests/${testIdNum}/export/xml`, `test_${testIdNum}.xml`)
            }
          >
            Pobierz XML
          </Button>
        </DownloadBar>
        <Footer />
      </ContentWrapper>
    </PageWrapper>
  );
};

export default TestDetailPage;
