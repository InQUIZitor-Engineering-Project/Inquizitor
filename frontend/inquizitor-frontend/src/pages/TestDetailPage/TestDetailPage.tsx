import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { getMyTests, getTestDetail } from "../../services/test";
import type { TestDetail, TestOut } from "../../services/test";

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

const TestDetailPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [data, setData] = useState<TestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tests, setTests] = useState<TestOut[]>([]);
  const navigate = useNavigate();



  useEffect(() => {
    if (!testId) return;
    getTestDetail(Number(testId))
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    getMyTests()
          .then((data) => setTests(data))
          .catch(console.error)
          .finally(() => setLoading(false));
  }, [testId]);

  if (loading) return <PageWrapper>Ładowanie…</PageWrapper>;
  if (error) return <PageWrapper>Błąd: {error}</PageWrapper>;
  if (!data) return null;

    if (data) {
        console.log("Test detail:", data);
        data.questions.forEach((q) =>
        console.log(`Question ${q.id} choices:`, q.choices)
        );
    }

  return (
    <PageWrapper>
      <Sidebar
        tests={tests}
        onSelect={(testId) => navigate(`/dashboard/${testId}`)}
        onCreateNew={() => {}}
      />

      <ContentWrapper>
        <Header>{data.title}</Header>
        <Meta>
          {data.questions.length} pytań |{" "}
          {data.questions.filter((q) => q.difficulty === 1).length} łatwe,{" "}
          {data.questions.filter((q) => q.difficulty === 2).length} średnie,{" "}
          {data.questions.filter((q) => q.difficulty === 3).length} trudne |{" "}
          {data.questions[0]?.is_closed
            ? "Zamknięte"
            : "Otwarte"}
        </Meta>

        <QuestionList>
          {data.questions.map((q, idx) => (
            <QuestionItem key={q.id}>
              <div className="question-header">
                {idx + 1}. {q.text}
              </div>

              {q.is_closed && q.choices && (
                <ChoiceList>
                  {q.choices.map((choice, ci) => {
                    const isCorrect =
                      q.correct_choices?.includes(choice)
                    return (
                      <ChoiceItem
                        key={ci}
                        $correct={isCorrect}
                      >
                        {String.fromCharCode(65 + ci)}. {choice}
                      </ChoiceItem>
                    );
                  })}
                </ChoiceList>
              )}

              {!q.is_closed && (
                <textarea
                  readOnly
                  value=""
                  placeholder="Odpowiedź otwarta…"
                />
              )}
            </QuestionItem>
          ))}
        </QuestionList>
      </ContentWrapper>
    </PageWrapper>
  );
};

export default TestDetailPage;
