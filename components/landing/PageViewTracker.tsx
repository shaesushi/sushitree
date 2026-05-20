"use client";

import { useEffect } from "react";
import { trackPageView } from "@/lib/tracking";

export function PageViewTracker() {
  useEffect(() => {
    trackPageView();
  }, []);
  return null;
}
