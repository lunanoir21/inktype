import "server-only";
import { cookies, headers } from "next/headers";
import type { Locale } from "./translate";

/** The language to render on the server: saved preference, else Accept-Language. */
export function getServerLocale(): Locale {
  const pref = cookies().get("inktype-lang")?.value;
  if (pref === "en" || pref === "tr") return pref;
  const accept = headers().get("accept-language") ?? "";
  return accept.toLowerCase().trim().startsWith("tr") ? "tr" : "en";
}
