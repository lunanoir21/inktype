"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { authenticate, fetchAccount, logout, markSyncEnabled, syncNow, type Account } from "@/lib/sync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { useLocale, useT } from "@/lib/i18n";

/**
 * Optional local account on the self-hosted server, used only to sync
 * progress between devices. Nothing is required to use Inktype.
 */
export function AccountPanel() {
  const [state, setState] = useState<{ user: Account | null; registrationOpen: boolean } | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const t = useT();
  const locale = useLocale();

  useEffect(() => {
    void fetchAccount().then((s) => {
      setState(s);
      if (!s.registrationOpen) setMode("login");
    });
    setLastSync(window.localStorage.getItem("inktype:last-sync"));
  }, []);

  const doSync = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await syncNow();
      setLastSync(new Date().toISOString());
      setMessage(t("account.synced"));
    } catch (e) {
      setMessage(e instanceof Error && e.message.startsWith("Signed out") ? e.message : t("account.syncFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (!state) return <p className="py-4 text-sm text-muted">{t("account.checking")}</p>;

  if (state.user) {
    return (
      <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[15px]">
            {t("account.signedInAs")} <span className="font-medium">{state.user.username}</span>
          </p>
          <p className="text-xs text-muted">
            {t("account.autoSync")}
            {lastSync && ` ${t("account.lastSync", { when: new Date(lastSync).toLocaleString(locale) })}`}
          </p>
          {message && <p className="mt-1 text-xs text-muted" role="status">{message}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={doSync} disabled={busy}>
            <RefreshCw className={busy ? "animate-spin" : undefined} /> {t("account.syncNow")}
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await logout();
              setState({ ...state, user: null });
            }}
          >
            {t("account.signOut")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 py-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage(null);
        try {
          const user = await authenticate(mode, username, password);
          markSyncEnabled(true);
          setState({ ...state, user });
          setPassword("");
          await doSync();
        } catch (err) {
          setMessage(err instanceof Error && err.message ? err.message : t("account.failed"));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-sm text-muted">
        {t("account.intro")}
      </p>
      {state.registrationOpen && (
        <Segmented
          aria-label={t("account.mode")}
          value={mode}
          onChange={setMode}
          options={[
            { value: "login", label: t("account.signIn") },
            { value: "register", label: t("account.create") },
          ]}
        />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          placeholder={t("account.username")}
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={32}
        />
        <Input
          placeholder={t("account.password")}
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {mode === "login" ? t("account.signIn") : t("account.create")}
        </Button>
        {message && <p className="text-sm text-error" role="alert">{message}</p>}
      </div>
    </form>
  );
}
