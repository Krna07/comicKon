import { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { startSession, updateProgress } from '../api/comicApi';

const SESSION_KEY = 'dhuaa_session_id';

function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useSessionTracker(currentPage, totalPages) {
  const sessionIdRef = useRef(getOrCreateSessionId());
  const startTimeRef = useRef(Date.now());
  const lastSentPageRef = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    startSession(sessionIdRef.current).catch(() => {
      // Silently fail — analytics is non-critical
    });
  }, []);

  // Send progress update when page changes
  const sendProgress = useCallback(
    (page) => {
      if (!page || page === lastSentPageRef.current) return;
      lastSentPageRef.current = page;

      const timeSpentSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      updateProgress(sessionIdRef.current, page, timeSpentSeconds, totalPages).catch(() => {});
    },
    [totalPages]
  );

  useEffect(() => {
    if (currentPage) {
      sendProgress(currentPage);
    }
  }, [currentPage, sendProgress]);

  // Heartbeat every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSentPageRef.current) {
        const timeSpentSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        updateProgress(
          sessionIdRef.current,
          lastSentPageRef.current,
          timeSpentSeconds,
          totalPages
        ).catch(() => {});
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [totalPages]);

  return { sessionId: sessionIdRef.current };
}
