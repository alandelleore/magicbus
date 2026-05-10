import { useState, useEffect, useRef } from 'react';

export function usePollingCountdown<T>(
  fetchFn: () => Promise<T>,
  setData: (data: T) => void,
  intervalMs = 30000,
) {
  const [secondsLeft, setSecondsLeft] = useState(intervalMs / 1000);
  const [loading, setLoading] = useState(true);
  const initialDone = useRef(false);

  useEffect(() => {
    const doFetch = async () => {
      if (initialDone.current) {
        setLoading(false);
      }
      try {
        const result = await fetchFn();
        setData(result);
      } catch {
        // silent
      } finally {
        if (!initialDone.current) {
          initialDone.current = true;
        }
        setLoading(false);
      }
    };

    doFetch();

    const pollTimer = setInterval(doFetch, intervalMs);
    const countdownTimer = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? intervalMs / 1000 : s - 1));
    }, 1000);

    return () => {
      clearInterval(pollTimer);
      clearInterval(countdownTimer);
    };
  }, []);

  return { secondsLeft, loading };
}
