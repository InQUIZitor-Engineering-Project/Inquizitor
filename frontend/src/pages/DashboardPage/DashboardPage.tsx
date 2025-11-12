import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTests } from "../../services/test";
import type { TestOut } from "../../services/test";
import Sidebar from "../../components/Sidebar/Sidebar";
import useDocumentTitle from "../../components/GeneralComponents/Hooks/useDocumentTitle";

import {
  DashboardWrapper,
  EmptyStateWrapper,
  EmptyStateImage,
  EmptyStateHeading,
  EmptyStateButton,
  Subheading,
} from "./DashboardPage.styles";
import Footer from "../../components/Footer/Footer";

const EMPTY_ILLUSTRATION = "/src/assets/dashboard_welcome.png";
const HUB_ILLUSTRATION = "/src/assets/dashboard_welcome.png"; //TODO: find a new pic?

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [tests, setTests] = useState<TestOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTests()
      .then((data) => setTests(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useDocumentTitle("Panel główny | Inquizitor");
  
  if (loading) return null; // Or a full-page spinner

  if (tests.length === 0) {
    return (
      <EmptyStateWrapper>
        <EmptyStateImage src={EMPTY_ILLUSTRATION} alt="Brak testów" />
        <EmptyStateHeading>
          Stwórz swój pierwszy test, aby zacząć!
        </EmptyStateHeading>
        <EmptyStateButton onClick={() => navigate(`/tests/new`)}>
          + Utwórz nowy
        </EmptyStateButton>
      </EmptyStateWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <Sidebar
        tests={tests}
        onSelect={(testId) => navigate(`/tests/${testId}`)}
        onCreateNew={() => navigate(`/tests/new`)}
      />

      {/* This is the new "hub" content area, re-using EmptyState components */}
      {/* We pass $isHub to modify its style (see styles file) */}
      <EmptyStateWrapper $isHub={true}>
        <EmptyStateImage src={HUB_ILLUSTRATION} alt="Wybierz test" />
        <EmptyStateHeading>
          Witaj w panelu InQUIZitor!
        </EmptyStateHeading>
        <Subheading>
          Wybierz istniejący test z panelu bocznego, aby zobaczyć szczegóły, lub utwórz nowy.
        </Subheading>
        <EmptyStateButton onClick={() => navigate(`/tests/new`)}>
          + Utwórz nowy
        </EmptyStateButton>
        <Footer />
      </EmptyStateWrapper>
    </DashboardWrapper>
  );
};

export default DashboardPage;
