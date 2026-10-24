import { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { startSession, updateProgress } from '../api/comicApi';

const SESSION_KEY     = 'dhuaa_session_id';
const READER_NAME_KEY = 'dhuaa_reader_name';

function getOrCreateSessionId(episodeId) {
  const storageKey = episodeId ? `${SESSION_KEY}_${episodeId}` : SESSION_KEY;
  let id = localStorage.getItem(storageKey);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(storageKey, id);
  }
  return id;
}

export function getStoredReaderName() {
  return localStorage.getItem(READER_NAME_KEY) || '';
}

export function setStoredReaderName(name) {
  localStorage.setItem(READER_NAME_KEY, name);
}

export function useSessionTracker(currentPage, totalPages, readerName, episodeId, episodeTitle, episodeNumber) {
  const sessionIdRef = useRef(getOrCreateSessionId(episodeId));
  const startTimeRef = useRef(Date.now());
  const lastSentPageRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!readerName) return;
    if (initializedRef.current && sessionIdRef.current !== getOrCreateSessionId(episodeId)) {
      initializedRef.current = false;
    }
    if (initializedRef.current) return;
    initializedRef.current = true;
    startSession(sessionIdRef.current, readerName, episodeId, episodeTitle, episodeNumber).catch(() => {});
  }, [readerName, episodeId, episodeTitle, episodeNumber]);

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId(episodeId);
    startTimeRef.current = Date.now();
    lastSentPageRef.current = null;
    initializedRef.current = false;
  }, [episodeId]);

  const sendProgress = useCallback(
    (page) => {
      if (!page || page === lastSentPageRef.current) return;
      lastSentPageRef.current = page;
      const timeSpentSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      updateProgress(sessionIdRef.current, page, timeSpentSeconds, totalPages, episodeId).catch(() => {});
    },
    [episodeId, totalPages]
  );

  useEffect(() => {
    if (currentPage && readerName) sendProgress(currentPage);
  }, [currentPage, sendProgress, readerName]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSentPageRef.current && readerName) {
        const timeSpentSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        updateProgress(
          sessionIdRef.current,
          lastSentPageRef.current,
          timeSpentSeconds,
          totalPages,
          episodeId
        ).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [episodeId, totalPages, readerName]);

  return { sessionId: sessionIdRef.current };
}
