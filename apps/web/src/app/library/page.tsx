import { Suspense } from "react";
import type { Metadata } from "next";
import { LibraryBrowser } from "@/components/library/library-browser";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryBrowser />
    </Suspense>
  );
}
