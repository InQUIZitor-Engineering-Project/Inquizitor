import { useEffect, useRef, useState } from "react";
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
  const timerRef = useRef<number | null>(null);

  const stopPolling = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPolling(false);
  };

  const reset = () => {
    stopPolling();
    setJobId(null);
    setJob(null);
    setStatus(null);
    setError(null);
  };

  const startPolling = (id: number) => {
    reset();
    setJobId(id);
    setStatus("queued");
    setIsPolling(true);
  };

  useEffect(() => {
    if (!isPolling || jobId === null) return;

    let cancelled = false;

    const fetchJob = async () => {
      try {
        const data = await getJob(jobId);
        if (cancelled) return;
        setJob(data);
        setStatus(data.status);

        const normalized = (data.status || "").toLowerCase();
        if (normalized === "done") {
          stopPolling();
          options?.onDone?.(data);
        } else if (normalized === "failed") {
          stopPolling();
          setError(data.error || "Zadanie zakończyło się niepowodzeniem");
          options?.onFail?.(data);
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || "Nie udało się pobrać statusu zadania");
      }
    };

    // pierwsze odpytanie natychmiast
    void fetchJob();
    const timer = window.setInterval(fetchJob, intervalMs);
    timerRef.current = timer;

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      timerRef.current = null;
    };
  }, [isPolling, jobId, intervalMs, options]);

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
