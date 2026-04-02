"use client";

import { useEffect, useState } from "react";

import { useAuthStore } from "@/lib/store";

export function useAuthHydration() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setReady(true));
    if (useAuthStore.persist.hasHydrated()) setReady(true);
    return unsub;
  }, []);
  return ready;
}
