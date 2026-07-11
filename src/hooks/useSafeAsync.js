import { useRef, useEffect, useCallback } from "react";

/**
 * Safe async state guard
 * предотвращает setState после unmount
 */
export const useSafeAsync = () => {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runIfMounted = useCallback((fn) => {
    if (mountedRef.current && typeof fn === "function") {
      fn();
    }
  }, []);

  const isMounted = useCallback(() => mountedRef.current, []);

  return {
    runIfMounted,
    isMounted,
  };
};

export default useSafeAsync;
