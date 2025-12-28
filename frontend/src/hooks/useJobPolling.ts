import { useEffect, useRef, useState, useCallback } from "react";
import { getJob, type JobOut } from "../services/test";

type Status = string | null;

interface UseJobPollingOptions {
  intervalMs?: number;
  onDone?: (job: JobOut) => void;
  onFail?: (job: JobOut) => void;
}

export function useJobPolling(options?: UseJobPollingOptions) {
  const intervalMs = options?.intervalMs ?? 1500;
  const [jobId, setJobId] = useState<number | null>(null);
  const [job, setJob] = useState<JobOut | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  // Przechowujemy opcje w refie, aby zmiany funkcji callback nie restartowały efektu
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setJobId(null);
    setJob(null);
    setStatus(null);
    setError(null);
  }, [stopPolling]);

  const startPolling = useCallback((id: number) => {
    setJobId(id);
    setJob(null);
    setStatus("queued");
    setError(null);
    setIsPolling(true);
  }, []);

  useEffect(() => {
    if (!isPolling || jobId === null) return;

    let timeoutId: number | null = null;
    let cancelled = false;

    const fetchJob = async () => {
      try {
        const data = await getJob(jobId);
        if (cancelled) return;

        setJob(data);
        setStatus(data.status);

        const normalized = (data.status || "").toLowerCase();
        if (normalized === "done") {
          setIsPolling(false);
          optionsRef.current?.onDone?.(data);
        } else if (normalized === "failed") {
          setIsPolling(false);
          setError(data.error || "Zadanie zakończyło się niepowodzeniem");
          optionsRef.current?.onFail?.(data);
        } else {
          // Zadanie w toku - planujemy kolejne sprawdzenie za stale 1.5s
          timeoutId = window.setTimeout(fetchJob, intervalMs);
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || "Nie udało się pobrać statusu zadania");
        // W razie błędu sieciowego próbujemy dalej za 1.5s
        timeoutId = window.setTimeout(fetchJob, intervalMs);
      }
    };

    // Rozpoczynamy pierwszą weryfikację
    fetchJob();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isPolling, jobId, intervalMs]);

  return {
    jobId,
    job,
    status,
    error,
    isPolling,
    startPolling,
    stopPolling,
    reset,
    result: job?.result,
  };
}

export default useJobPolling;
