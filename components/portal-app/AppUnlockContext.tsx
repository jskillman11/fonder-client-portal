"use client";

import { createContext, useContext, useState } from "react";

const UnlockContext = createContext<{
  docsSent: boolean;
  markDocsSent: () => void;
} | null>(null);

export function AppUnlockProvider({ children }: { children: React.ReactNode }) {
  const [docsSent, setDocsSent] = useState(false);
  return (
    <UnlockContext.Provider value={{ docsSent, markDocsSent: () => setDocsSent(true) }}>
      {children}
    </UnlockContext.Provider>
  );
}

export function useAppUnlock() {
  const ctx = useContext(UnlockContext);
  if (!ctx) throw new Error("useAppUnlock must be used within AppUnlockProvider");
  return ctx;
}
