import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Ring } from "ldrs/react";
import "ldrs/react/Ring.css";

interface LoaderContextValue {
  startLoading: () => void;
  stopLoading: () => void;
  withLoader: <T>(fn: () => Promise<T>) => Promise<T>;
}

const LoaderContext = createContext<LoaderContextValue | undefined>(undefined);

export const LoaderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  const startLoading = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setCount((c) => Math.max(0, c - 1));
  }, []);

  // Delikatne opóźnienia, żeby nie migało przy szybkich akcjach
  useEffect(() => {
    if (count > 0) {
      const showTimer = setTimeout(() => setVisible(true), 120);
      return () => clearTimeout(showTimer);
    } else {
      const hideTimer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(hideTimer);
    }
  }, [count]);

  const withLoader = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      startLoading();
      try {
        return await fn();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading],
  );

  return (
    <LoaderContext.Provider
      value={{ startLoading, stopLoading, withLoader }}
    >
      {children}

      {visible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.45)",
            backdropFilter: "blur(2px)",
            zIndex: 9999,
          }}
        >
          <Ring
            size={60}
            speed={1.2}
            color="#4CAF4F"
            bgOpacity={0}
          />
        </div>
      )}
    </LoaderContext.Provider>
  );
};

export const useLoader = (): LoaderContextValue => {
  const ctx = useContext(LoaderContext);
  if (!ctx) {
    throw new Error("useLoader must be used within LoaderProvider");
  }
  return ctx;
};
