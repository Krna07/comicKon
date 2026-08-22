import { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { startSession, updateProgress } from '../api/comicApi';

const SESSION_KEY     = 'dhuaa_session_id';
const READER_NAME_KEY = 'dhuaa_reader_name';

function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getStoredReaderName() {
  return localStorage.getItem(READER_NAME_KEY) || '';
}

export function setStoredReaderName(name) {
  localStorage.setItem(READER_NAME_KEY, name);
}

export function useSessionTracker(currentPage, totalPages, readerName) {
  const sessionIdRef    = useRef(getOrCreateSessionId());
  const startTimeRef    = useRef(Date.now());
  const lastSentPageRef = useRef(null);
  const initializedRef  = useRef(false);

  // Initialize session on mount (or when name is first set)
  useEffect(() => {
    if (!readerName) return;          // wait until we have a name
    if (initializedRef.current) return;
    initializedRef.current = true;
    startSession(sessionIdRef.current, readerName).catch(() => {});
  }, [readerName]);

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
    if (currentPage && readerName) sendProgress(currentPage);
  }, [currentPage, sendProgress, readerName]);

  // Heartbeat every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSentPageRef.current && readerName) {
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
  }, [totalPages, readerName]);

  return { sessionId: sessionIdRef.current };
}
