"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUi } from "@/lib/ui-state";

/** Settings are a drawer; this route just opens it (keeps old links working). */
export default function SettingsRoute() {
  const router = useRouter();
  const openSettings = useUi((s) => s.openSettings);
  useEffect(() => {
    openSettings(true);
    router.replace("/");
  }, [openSettings, router]);
  return null;
}
