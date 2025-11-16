"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type TopLoaderContextValue = {
  show: () => void;
  hide: () => void;
};

const TopLoaderContext = createContext<TopLoaderContextValue | null>(null);

export function TopLoaderProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  // When route changes, auto-hide the loader after a short delay for smoothness
  useEffect(() => {
    if (lastPath.current === null) {
      lastPath.current = pathname;
      return;
    }
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      if (visible) {
        const t = setTimeout(() => setVisible(false), 200);
        return () => clearTimeout(t);
      }
    }
  }, [pathname, visible]);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <TopLoaderContext.Provider value={value}>
      {children}
      {visible ? (
        <div className="top-loader" aria-hidden>
          <div className="top-loader-bar" />
        </div>
      ) : null}
    </TopLoaderContext.Provider>
  );
}

export function useTopLoader() {
  const ctx = useContext(TopLoaderContext);
  if (!ctx) {
    // No provider found: provide no-op fallbacks
    return {
      show: () => {},
      hide: () => {},
    } satisfies TopLoaderContextValue;
  }
  return ctx;
}

