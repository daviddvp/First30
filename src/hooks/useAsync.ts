"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  setData: (updater: (prev: T | null) => T | null) => void;
}

/** Ejecuta una promesa y expone estados loading/error/data, con recarga. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(() => {
    setLoading(true); setError(null);
    fnRef.current()
      .then((d) => setDataState(d))
      .catch((e) => setError(e instanceof Error ? e.message : "Error desconocido"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);

  const setData = useCallback((updater: (prev: T | null) => T | null) => setDataState(updater), []);
  return { data, loading, error, reload: run, setData };
}
