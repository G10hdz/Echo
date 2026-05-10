import { useState, useEffect } from 'react';
import {
  Languages,
  BookOpen,
  ChevronRight,
  CheckCircle,
  RefreshCw,
  Moon,
  Sun,
  Volume2,
} from 'lucide-react';
import { loadSettings, saveSettings, AppSettings, DEFAULT_SETTINGS, LANGUAGE_LABELS } from '../types';
import * as api from '../services/api';

const VOICE_OPTIONS = [
  { id: 'alloy', label: 'Alloy (Neutral)' },
  { id: 'echo', label: 'Echo (Warm)' },
  { id: 'fable', label: 'Fable (Narrator)' },
  { id: 'onyx', label: 'Onyx (Deep)' },
  { id: 'nova', label: 'Nova (Friendly)' },
  { id: 'shimmer', label: 'Shimmer (Soft)' },
];

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="card mb-6">
      <h3
        className="text-lg font-semibold mb-1 flex items-center gap-2"
        style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm mb-4" style={{ color: 'var(--on-surface-variant)' }}>
          {description}
        </p>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

interface SettingRowProps {
  label: string;
  detail?: string;
  children: React.ReactNode;
}

function SettingRow({ label, detail, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-outline-variant last:border-b-0">
      <div className="flex flex-col">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--on-surface)', fontFamily: 'var(--font-body)' }}
        >
          {label}
        </span>
        {detail && (
          <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
            {detail}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

function SettingsSelect({
  value,
  onChange,
  options,
  icon: Icon,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="p-2 rounded-lg"
        style={{ backgroundColor: 'var(--accent-container)' }}
      >
        <Icon size={16} style={{ color: 'var(--accent)' }} aria-hidden="true" />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        style={{
          flex: 1,
          maxWidth: '240px',
          appearance: 'auto',
          cursor: 'pointer',
        }}
        aria-label="Select option"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronRight size={16} style={{ color: 'var(--on-surface-variant)' }} aria-hidden="true" />
    </div>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const resetToDefaults = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    saveSettings(DEFAULT_SETTINGS);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
        >
          Settings
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.125rem' }}>
          Customize your pronunciation practice experience
        </p>
      </div>

      {/* Saved indicator */}
      {saved && (
        <div
          className="toast-success mb-6 flex items-center gap-2 p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--surface-container-lowest)',
            border: '1px solid var(--score-correct)',
          }}
          role="status"
        >
          <CheckCircle size={16} style={{ color: 'var(--score-correct)' }} aria-hidden="true" />
          <span style={{ color: 'var(--score-correct)', fontSize: '0.875rem', fontWeight: 500 }}>
            Settings saved
          </span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveSettings(settings);
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        }}
      >
        {/* Language Settings */}
        <SettingsSection
          title="Language & Level"
          description="Choose the language you want to practice and your proficiency level."
        >
          <SettingRow
            label="Practice Language"
            detail="Sentences will be loaded in this language"
          >
            <SettingsSelect
              value={settings.language}
              onChange={(val) => updateSetting('language', val as AppSettings['language'])}
              options={SUPPORTED_LANGUAGES.map((lang) => ({
                value: lang,
                label: LANGUAGE_LABELS[lang],
              }))}
              icon={Languages}
            />
          </SettingRow>

          <SettingRow
            label="Difficulty Level"
            detail="Sentences are curated to match your level"
          >
            <SettingsSelect
              value={settings.level}
              onChange={(val) => updateSetting('level', val as AppSettings['level'])}
              options={[
                { value: 'A1', label: 'A1 — Beginner' },
                { value: 'A2', label: 'A2 — Elementary' },
                { value: 'B1', label: 'B1 — Intermediate' },
                { value: 'B2', label: 'B2 — Upper Intermediate' },
                { value: 'C1', label: 'C1 — Advanced' },
                { value: 'C2', label: 'C2 — Proficient' },
              ]}
              icon={BookOpen}
            />
          </SettingRow>
        </SettingsSection>

        {/* TTS Settings */}
        <SettingsSection
          title="Voice Settings"
          description="Pick a voice for correct pronunciation playback (requires ElevenLabs API key)."
        >
          <SettingRow
            label="TTS Voice"
            detail="Leave as default to use the system voice"
          >
            <SettingsSelect
              value={settings.voiceId}
              onChange={(val) => updateSetting('voiceId', val)}
              options={[
                { value: '', label: 'System Default' },
                ...VOICE_OPTIONS.map((v) => ({ value: v.id, label: v.label })),
              ]}
              icon={Volume2}
            />
          </SettingRow>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection
          title="Appearance"
          description="Toggle dark mode for easier nighttime practice."
        >
          <SettingRow
            label="Dark Mode"
            detail="Switch between light and dark themes"
          >
            <button
              type="button"
              onClick={() => updateSetting('darkMode', !settings.darkMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                settings.darkMode
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-700'
              } hover:shadow-md`}
              style={{
                border: '1px solid var(--outline-variant)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
              }}
              aria-pressed={settings.darkMode}
            >
              {settings.darkMode ? (
                <>
                  <Moon size={16} aria-hidden="true" />
                  Dark
                </>
              ) : (
                <>
                  <Sun size={16} aria-hidden="true" />
                  Light
                </>
              )}
            </button>
          </SettingRow>
        </SettingsSection>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
          >
            <CheckCircle size={16} aria-hidden="true" />
            Save Settings
          </button>
          <button
            type="button"
            onClick={resetToDefaults}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Reset to Defaults
          </button>
        </div>
      </form>
    </div>
  );
}