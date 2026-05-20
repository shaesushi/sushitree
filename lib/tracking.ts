"use client";

import { createClient } from "@/lib/supabase/client";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("_sid", sid);
  }
  return sid;
}

export async function trackClick(params: {
  id: string;
  label: string;
  href?: string;
}) {
  try {
    const supabase = createClient();
    await supabase.from("click_events").insert({
      button_id: params.id,
      button_label: params.label,
      href: params.href ?? null,
      session_id: getSessionId(),
      page_url: window.location.href,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });

    // Also fire GA4 event if configured
    type GtagFn = (...args: unknown[]) => void;
    if (typeof window !== "undefined" && (window as { gtag?: GtagFn }).gtag) {
      (window as { gtag?: GtagFn }).gtag!("event", "button_click", {
        button_id: params.id,
        button_label: params.label,
      });
    }
  } catch {
    // Silently fail — tracking should never break the UX
  }
}

export async function trackPageView() {
  try {
    const supabase = createClient();
    await supabase.from("page_views").insert({
      session_id: getSessionId(),
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });
  } catch {
    // Silently fail
  }
}
