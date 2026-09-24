"use client";

/**
 * The settings, as sections of the right-hand drawer. Every change applies
 * immediately and is saved to this device.
 */

import { useRef, useState } from "react";
import { Download, Plus, Trash2, Upload, Volume2 } from "lucide-react";
import { mergeData, sanitizeData, type CursorStyle, type CustomTheme, type Settings } from "@inktype/core";
import { useStore } from "@/lib/store";
import { BUILTIN_THEMES, LOOKS, colorsToVars } from "@/lib/themes";
import { FONT_CATALOG, type FontCategory } from "@/lib/font-catalog";
import { BACKGROUNDS, CURSOR_EFFECTS, TYPING_EFFECTS } from "@/lib/effects";
import { playError, playKey } from "@/lib/sound";
import { exportStats } from "@/lib/download";
import { cn, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AccountPanel } from "./account-panel";
import { CursorShapeTiles, EffectTiles } from "./effect-previews";
import { LOCALES, useT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";

type Update = (patch: Partial<Settings>) => void;

export function Section({
  title,
  children,
  defaultOpen = false,
  expanded,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  expanded?: boolean;
}) {
  return (
    <details className="group border-b border-line/70 py-1" open={expanded || defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md px-1 py-2.5 text-[15px] font-medium hover:text-accent [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden className="text-muted transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="space-y-3 px-1 pb-4 pt-1">{children}</div>
    </details>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5">
      <span>
        <span className="block text-sm">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

/* ---------------------------------------------------------------- language */

export function LanguageRow({ settings, update }: { settings: Settings; update: Update }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/70 px-1 py-3">
      <span className="text-[15px] font-medium">{t("settings.language")}</span>
      <Segmented
        aria-label={t("settings.language")}
        value={settings.uiLanguage}
        onChange={(uiLanguage) => update({ uiLanguage })}
        options={[{ value: "auto", label: t("settings.languageAuto") }, ...LOCALES.map((l) => ({ value: l.code as string, label: l.label }))]}
      />
    </div>
  );
}

/* ------------------------------------------------------------------- looks */

export function LooksSection({ settings, update, expanded }: { settings: Settings; update: Update; expanded?: boolean }) {
  const t = useT();
  return (
    <Section title={t("settings.looks")} defaultOpen expanded={expanded}>
      <p className="text-xs text-muted">{t("settings.looksHint")}</p>
      <div className="grid grid-cols-2 gap-2">
        {LOOKS.map((look) => {
          const { vars } = colorsToVars(BUILTIN_THEMES[look.theme]!.colors);
          const active = settings.theme === look.theme && settings.font === look.font && settings.background === look.background;
          const font = FONT_CATALOG.find((f) => f.id === look.font);
          return (
            <button
              key={look.id}
              type="button"
              aria-pressed={active}
              onClick={() =>
                update({
                  theme: look.theme,
                  font: look.font,
                  cursorStyle: look.cursorStyle,
                  background: look.background,
                  boldText: look.boldText,
                })
              }
              className={cn(
                "flex h-20 flex-col justify-between rounded-lg border p-2.5 text-left transition-shadow",
                active ? "ring-2 ring-accent" : "hover:ring-1 hover:ring-fg/30",
              )}
              style={{ background: `rgb(${vars.bg})`, color: `rgb(${vars.fg})`, borderColor: `rgb(${vars.line})` }}
            >
              <span style={{ fontFamily: font?.family, fontWeight: look.boldText ? 700 : 400 }} className="text-base leading-none">
                Aa<span style={{ color: `rgb(${vars.accent})` }}>.</span>
                <span className="ml-1 text-[11px] font-normal" style={{ color: `rgb(${vars.muted})` }}>
                  {t("settings.looksSample")}
                </span>
              </span>
              <span className="text-xs">{t(`look.${look.id}` as MessageKey)}</span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------- effects */

export function EffectsSections({ settings, update, expanded }: { settings: Settings; update: Update; expanded?: boolean }) {
  const t = useT();
  return (
    <>
      <Section title={t("settings.typingEffects")} expanded={expanded}>
        <p className="text-xs text-muted">{t("settings.previewHint")}</p>
        <EffectTiles
          kind="typing"
          options={TYPING_EFFECTS}
          value={settings.typingEffect}
          onChange={(typingEffect) => update({ typingEffect })}
          themeKey={settings.theme}
        />
      </Section>
      <Section title={t("settings.cursorEffects")} expanded={expanded}>
        <EffectTiles
          kind="cursor"
          options={CURSOR_EFFECTS}
          value={settings.cursorEffect}
          onChange={(cursorEffect) => update({ cursorEffect })}
          themeKey={settings.theme}
        />
      </Section>
      <Section title={t("settings.backgrounds")} expanded={expanded}>
        <EffectTiles
          kind="background"
          options={BACKGROUNDS}
          value={settings.background}
          onChange={(background) => update({ background })}
          themeKey={settings.theme}
        />
        <p className="text-xs text-muted">{t("settings.backgroundsHint")}</p>
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------ cursor */

const CURSORS: { id: CursorStyle; label: string }[] = [
  { id: "box", label: "Box" },
  { id: "line", label: "Line" },
  { id: "under", label: "Under" },
  { id: "dot", label: "Dot" },
  { id: "high", label: "High" },
  { id: "ebox", label: "E-Box" },
  { id: "hunder", label: "H-Under" },
  { id: "hdot", label: "H-Dot" },
  { id: "none", label: "None" },
];

export function CursorSection({ settings, update, expanded }: { settings: Settings; update: Update; expanded?: boolean }) {
  const t = useT();
  return (
    <Section title={t("settings.cursor")} expanded={expanded}>
      <CursorShapeTiles options={CURSORS.map((c) => ({ id: c.id, label: t(`cursor.${c.id}` as MessageKey) }))} value={settings.cursorStyle} onChange={(cursorStyle) => update({ cursorStyle })} />
      <Toggle label={t("settings.smoothCursor")} hint={t("settings.smoothCursorHint")} checked={settings.smoothCaret} onChange={(smoothCaret) => update({ smoothCaret })} />
    </Section>
  );
}

/* ------------------------------------------------------------------ themes */

const EMPTY_THEME: CustomTheme["colors"] = {
  background: "#1d2021",
  foreground: "#ebdbb2",
  muted: "#7c6f64",
  accent: "#83a598",
  error: "#fb4934",
};

export function ThemesSection({ settings, update, expanded }: { settings: Settings; update: Update; expanded?: boolean }) {
  const t = useT();
  const [editing, setEditing] = useState<CustomTheme | null>(null);

  const all = [
    ...Object.entries(BUILTIN_THEMES).map(([id, th]) => ({ id, label: th.label, colors: th.colors, custom: false })),
    ...settings.customThemes.map((th) => ({ id: th.id, label: th.name, colors: th.colors, custom: true })),
  ];

  const save = (theme: CustomTheme) => {
    const exists = settings.customThemes.some((x) => x.id === theme.id);
    update({
      customThemes: exists ? settings.customThemes.map((x) => (x.id === theme.id ? theme : x)) : [...settings.customThemes, theme],
      theme: theme.id,
    });
    setEditing(null);
  };

  return (
    <Section title={t("settings.themes")} expanded={expanded}>
      <div className="grid grid-cols-3 gap-1.5">
        <ThemeChip
          label={t("settings.system")}
          active={settings.theme === "system"}
          onClick={() => update({ theme: "system" })}
          colors={BUILTIN_THEMES["classic-dark"]!.colors}
          split={BUILTIN_THEMES["classic-light"]!.colors.background}
        />
        {all.map((th) => (
          <ThemeChip
            key={th.id}
            label={th.label}
            colors={th.colors}
            active={settings.theme === th.id}
            onClick={() => update({ theme: th.id })}
            onEdit={() =>
              setEditing(
                th.custom
                  ? settings.customThemes.find((x) => x.id === th.id)!
                  : { id: uid(), name: t("settings.mine", { label: th.label }), colors: { ...th.colors } },
              )
            }
          />
        ))}
        <button
          type="button"
          onClick={() => setEditing({ id: uid(), name: t("settings.myTheme"), colors: { ...EMPTY_THEME } })}
          className="flex h-14 items-center justify-center gap-1 rounded-md border border-dashed border-line text-xs text-muted hover:text-fg"
        >
          <Plus className="h-3.5 w-3.5" /> {t("settings.new")}
        </button>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const current = all.find((th) => th.id === settings.theme);
          if (!current) return;
          setEditing(
            current.custom
              ? settings.customThemes.find((x) => x.id === current.id)!
              : { id: uid(), name: t("settings.mine", { label: current.label }), colors: { ...current.colors } },
          );
        }}
      >
        {t("settings.customise")}
      </Button>
      {editing && (
        <ThemeEditor
          theme={editing}
          isNew={!settings.customThemes.some((x) => x.id === editing.id)}
          onCancel={() => setEditing(null)}
          onSave={save}
          onDelete={() => {
            update({
              customThemes: settings.customThemes.filter((x) => x.id !== editing.id),
              theme: settings.theme === editing.id ? "classic-dark" : settings.theme,
            });
            setEditing(null);
          }}
        />
      )}
    </Section>
  );
}

function ThemeChip({
  label,
  colors,
  active,
  onClick,
  onEdit,
  split,
}: {
  label: string;
  colors: CustomTheme["colors"];
  active: boolean;
  onClick: () => void;
  onEdit?: () => void;
  split?: string;
}) {
  const t = useT();
  const hint = t("settings.customiseHint", { label });
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      onContextMenu={(e) => {
        if (!onEdit) return;
        e.preventDefault();
        onEdit();
      }}
      title={onEdit ? hint : label}
      className={cn("flex h-14 flex-col justify-between rounded-md border p-1.5 text-left", active ? "ring-2 ring-accent" : "")}
      style={{
        background: split ? `linear-gradient(135deg, ${colors.background} 50%, ${split} 50%)` : colors.background,
        color: colors.foreground,
        borderColor: `${colors.muted}55`,
      }}
    >
      <span className="flex gap-0.5">
        {[colors.foreground, colors.accent, colors.error].map((c, i) => (
          <i key={i} className="h-2 w-2 rounded-full" style={{ background: c }} />
        ))}
      </span>
      <span className="truncate text-[11px] leading-tight">{label}</span>
    </button>
  );
}

function ThemeEditor({
  theme,
  isNew,
  onSave,
  onCancel,
  onDelete,
}: {
  theme: CustomTheme;
  isNew: boolean;
  onSave: (t: CustomTheme) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState(theme);
  const { vars } = colorsToVars(draft.colors);
  const fields: { key: keyof CustomTheme["colors"]; label: string }[] = [
    { key: "background", label: t("settings.bg") },
    { key: "foreground", label: t("settings.typedText") },
    { key: "muted", label: t("settings.untypedText") },
    { key: "accent", label: t("settings.accent") },
    { key: "error", label: t("settings.mistakes") },
  ];
  return (
    <div className="space-y-3 rounded-lg border border-line p-3">
      <Input value={draft.name} maxLength={30} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label={t("settings.themeName")} />
      {fields.map((f) => (
        <label key={f.key} className="flex items-center justify-between gap-2 text-sm">
          {f.label}
          <span className="flex items-center gap-1.5">
            <Input
              value={draft.colors[f.key]}
              onChange={(e) => setDraft({ ...draft, colors: { ...draft.colors, [f.key]: e.target.value } })}
              className="h-8 w-24 font-mono text-xs"
              aria-label={`${f.label} hex`}
            />
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(draft.colors[f.key]) ? draft.colors[f.key] : "#000000"}
              onChange={(e) => setDraft({ ...draft, colors: { ...draft.colors, [f.key]: e.target.value } })}
              className="h-8 w-9 cursor-pointer rounded border border-line bg-transparent"
              aria-label={f.label}
            />
          </span>
        </label>
      ))}
      <p className="rounded-md p-3 font-serif text-sm" style={{ background: `rgb(${vars.bg})`, color: `rgb(${vars.fg})` }}>
        Call me Ishmael. Some <span style={{ background: `rgb(${vars.accent} / .3)` }}>y</span>
        <span style={{ color: `rgb(${vars.muted})` }}>ears ago — never </span>
        <span style={{ color: `rgb(${vars.error})` }}>m</span>
        <span style={{ color: `rgb(${vars.muted})` }}>ind how long.</span>
      </p>
      <div className="flex justify-between gap-2">
        {!isNew ? (
          <Button variant="danger" size="sm" onClick={onDelete}>
            <Trash2 /> {t("settings.delete")}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {t("settings.cancel")}
          </Button>
          <Button size="sm" onClick={() => onSave({ ...draft, name: draft.name.trim() || "Custom" })}>
            {t("settings.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- fonts */

const CATEGORY_LABEL: Record<FontCategory, MessageKey> = {
  serif: "settings.catSerif",
  sans: "settings.catSans",
  mono: "settings.catMono",
  display: "settings.catDisplay",
};

export function FontsSection({ settings, update, expanded }: { settings: Settings; update: Update; expanded?: boolean }) {
  const t = useT();
  const [category, setCategory] = useState<FontCategory | "all">("all");
  const fonts = FONT_CATALOG.filter((f) => category === "all" || f.category === category);
  return (
    <Section title={t("settings.fonts")} expanded={expanded}>
      <Segmented
        aria-label={t("settings.fontCategory")}
        value={category}
        onChange={setCategory}
        options={[
          { value: "all" as const, label: t("settings.catAll") },
          ...(Object.keys(CATEGORY_LABEL) as FontCategory[]).map((c) => ({ value: c, label: t(CATEGORY_LABEL[c]) })),
        ]}
      />
      <div className="grid max-h-72 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
        {fonts.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={settings.font === f.id}
            onClick={() => update({ font: f.id })}
            className={cn(
              "truncate rounded-md border px-2 py-2 text-left text-[15px]",
              settings.font === f.id ? "border-accent bg-accent/15" : "border-line hover:border-fg/30",
            )}
            style={{ fontFamily: f.family }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div>
        <div className="flex justify-between text-sm">
          {t("settings.size")} <span className="tabular-nums text-muted">{settings.fontSize}px</span>
        </div>
        <Slider min={14} max={48} step={1} value={[settings.fontSize]} onValueChange={([v]) => v !== undefined && update({ fontSize: v })} aria-label={t("settings.size")} />
      </div>
      <div className="flex items-center justify-between gap-2 text-sm">
        {t("settings.lineWidth")}
        <Segmented
          aria-label={t("settings.lineWidth")}
          value={settings.lineWidth}
          onChange={(lineWidth) => update({ lineWidth })}
          options={[
            { value: "narrow", label: t("settings.narrow") },
            { value: "medium", label: t("settings.medium") },
            { value: "wide", label: t("settings.wide") },
          ]}
        />
      </div>
      <Toggle label={t("settings.bold")} checked={settings.boldText} onChange={(boldText) => update({ boldText })} />
    </Section>
  );
}

/* ----------------------------------------------------------- functionality */

export function FunctionalitySection({ settings, update, expanded }: { settings: Settings; update: Update; expanded?: boolean }) {
  const t = useT();
  return (
    <Section title={t("settings.functionality")} expanded={expanded}>
      <Toggle label={t("settings.readingMode")} hint={t("settings.readingModeHint")} checked={settings.readingMode} onChange={(readingMode) => update({ readingMode })} />
      <Toggle label={t("settings.international")} hint={t("settings.internationalHint")} checked={settings.ignoreAccents} onChange={(ignoreAccents) => update({ ignoreAccents })} />
      <Toggle label={t("settings.ignoreCase")} checked={settings.ignoreCase} onChange={(ignoreCase) => update({ ignoreCase })} />
      <Toggle label={t("settings.skipPunct")} hint={t("settings.skipPunctHint")} checked={settings.skipPunctuation} onChange={(skipPunctuation) => update({ skipPunctuation })} />
      <Toggle
        label={t("settings.stopCursor")}
        hint={t("settings.stopCursorHint")}
        checked={settings.errorMode === "block"}
        onChange={(v) => update({ errorMode: v ? "block" : "advance" })}
      />
      <Toggle label={t("settings.literal")} hint={t("settings.literalHint")} checked={settings.showLiteralMistypes} onChange={(showLiteralMistypes) => update({ showLiteralMistypes })} />
      <Toggle label={t("settings.hideUi")} hint={t("settings.hideUiHint")} checked={settings.focusMode} onChange={(focusMode) => update({ focusMode })} />
      <Toggle label={t("settings.autoScroll")} hint={t("settings.autoScrollHint")} checked={settings.autoScroll} onChange={(autoScroll) => update({ autoScroll })} />
      <Toggle label={t("settings.keyboard")} hint={t("settings.keyboardHint")} checked={settings.virtualKeyboard} onChange={(virtualKeyboard) => update({ virtualKeyboard })} />
      <Toggle label={t("settings.liveStats")} checked={settings.showLiveStats} onChange={(showLiveStats) => update({ showLiveStats })} />
      <div className="space-y-1.5 pt-1">
        <p className="text-sm">{t("settings.updateEvery")}</p>
        <Segmented
          aria-label={t("settings.updateFreq")}
          value={settings.statsUpdate}
          onChange={(statsUpdate) => update({ statsUpdate })}
          options={[
            { value: "live", label: t("settings.key") },
            { value: "word", label: t("settings.word") },
            { value: "line", label: t("settings.line") },
            { value: "page", label: t("settings.pageUnit") },
          ]}
        />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------- sound */

export function SoundSection({ settings, update, expanded }: { settings: Settings; update: Update; expanded?: boolean }) {
  const t = useT();
  return (
    <Section title={t("settings.sound")} expanded={expanded}>
      <Toggle label={t("settings.keySound")} checked={settings.soundKeypress} onChange={(soundKeypress) => update({ soundKeypress })} />
      <Toggle label={t("settings.errorSound")} checked={settings.soundError} onChange={(soundError) => update({ soundError })} />
      <div className="flex items-center gap-2">
        <Slider min={0} max={1} step={0.05} value={[settings.soundVolume]} onValueChange={([v]) => v !== undefined && update({ soundVolume: v })} aria-label={t("settings.volume")} />
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("settings.testSound")}
          onClick={() => {
            playKey(settings.soundVolume);
            setTimeout(() => playKey(settings.soundVolume), 120);
            setTimeout(() => playError(settings.soundVolume), 300);
          }}
        >
          <Volume2 />
        </Button>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------- account & data */

export function AccountSection({ expanded }: { expanded?: boolean }) {
  const t = useT();
  return (
    <Section title={t("settings.account")} expanded={expanded}>
      <AccountPanel />
    </Section>
  );
}

export function DataSection({ expanded }: { expanded?: boolean }) {
  const t = useT();
  const data = useStore((s) => s.data);
  const replaceData = useStore((s) => s.replaceData);
  const resetAll = useStore((s) => s.resetAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const onImport = async (file: File) => {
    try {
      const incoming = sanitizeData(JSON.parse(await file.text()));
      replaceData(mergeData(data, incoming));
      setMessage(t("settings.imported", { pages: incoming.sessions.length, books: Object.keys(incoming.progress).length }));
    } catch {
      setMessage(t("settings.badImport"));
    }
  };

  return (
    <Section title={t("settings.data")} expanded={expanded}>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => exportStats(data)}>
          <Download /> {t("settings.exportJson")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload /> {t("settings.import")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onImport(file);
            e.target.value = "";
          }}
        />
      </div>
      {confirming ? (
        <div className="space-y-2 rounded-md border border-error/40 p-3 text-sm">
          <p>{t("settings.eraseConfirm")}</p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                resetAll();
                setConfirming(false);
                setMessage(t("settings.erased"));
              }}
            >
              {t("settings.eraseYes")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              {t("settings.eraseNo")}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
          <Trash2 /> {t("settings.erase")}
        </Button>
      )}
      {message && (
        <p className="text-xs text-muted" role="status">
          {message}
        </p>
      )}
    </Section>
  );
}
