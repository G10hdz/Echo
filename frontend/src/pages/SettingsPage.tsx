import { useState, useEffect, useCallback } from 'react';
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
import { loadSettings, saveSettings } from '../services/api';
import { AppSettings, DEFAULT_SETTINGS, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const VOICE_OPTIONS = [
  { id: 'alloy', label: 'Alloy (neutral)' },
  { id: 'echo', label: 'Echo (cálida)' },
  { id: 'fable', label: 'Fable (narradora)' },
  { id: 'onyx', label: 'Onyx (grave)' },
  { id: 'nova', label: 'Nova (amigable)' },
  { id: 'shimmer', label: 'Shimmer (suave)' },
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
    <div className="flex items-center justify-between py-3 border-b border-border-light last:border-b-0">
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
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  icon: React.ElementType;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="p-2 rounded-lg"
        style={{ backgroundColor: 'var(--primary-container)' }}
      >
        <Icon size={16} style={{ color: 'var(--primary)' }} aria-hidden="true" />
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
          minHeight: 'var(--touch-target)',
        }}
        aria-label={ariaLabel}
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
  const { darkMode, toggleDarkMode } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const updateSetting = useCallback(<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [settings]);

  const resetToDefaults = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
    saveSettings(DEFAULT_SETTINGS);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
        >
          Configuración
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.125rem' }}>
          Personaliza tu práctica de pronunciación
        </p>
      </div>

      {/* Indicador de guardado */}
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
            Cambios guardados
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
        {/* Idioma y nivel */}
        <SettingsSection
          title="Idioma y nivel"
          description="Elige el idioma que quieres practicar y tu nivel de competencia."
        >
          <SettingRow
            label="Idioma de práctica"
            detail="Las frases se cargarán en este idioma"
          >
            <SettingsSelect
              value={settings.language}
              onChange={(val) => updateSetting('language', val as typeof settings.language)}
              options={SUPPORTED_LANGUAGES.map((lang) => ({
                value: lang,
                label: LANGUAGE_LABELS[lang],
              }))}
              icon={Languages}
              ariaLabel="Idioma de práctica"
            />
          </SettingRow>

          <SettingRow
            label="Nivel de dificultad"
            detail="Las frases se adaptan a tu nivel"
          >
            <SettingsSelect
              value={settings.level}
              onChange={(val) => updateSetting('level', val as typeof settings.level)}
              options={[
                { value: 'A1', label: 'A1 — Principiante' },
                { value: 'A2', label: 'A2 — Elemental' },
                { value: 'B1', label: 'B1 — Intermedio' },
                { value: 'B2', label: 'B2 — Intermedio alto' },
                { value: 'C1', label: 'C1 — Avanzado' },
                { value: 'C2', label: 'C2 — Maestría' },
              ]}
              icon={BookOpen}
              ariaLabel="Nivel de dificultad"
            />
          </SettingRow>
        </SettingsSection>

        {/* Voz TTS */}
        <SettingsSection
          title="Voz"
          description="Elige la voz con la que el servidor genera el audio de la pronunciación correcta."
        >
          <SettingRow
            label="Voz de reproducción"
            detail="Se usa al generar el audio de ejemplo en el servidor"
          >
            <SettingsSelect
              value={settings.voiceId}
              onChange={(val) => updateSetting('voiceId', val)}
              options={[
                { value: '', label: 'Voz predeterminada' },
                ...VOICE_OPTIONS.map((v) => ({ value: v.id, label: v.label })),
              ]}
              icon={Volume2}
              ariaLabel="Voz de reproducción"
            />
          </SettingRow>
        </SettingsSection>

        {/* Apariencia */}
        <SettingsSection
          title="Apariencia"
          description="Activa el modo oscuro para practicar de noche."
        >
          <SettingRow
            label="Modo oscuro"
            detail="Alterna entre tema claro y oscuro"
          >
            <button
              type="button"
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-4 rounded-lg transition-all"
              style={{
                minHeight: 'var(--touch-target)',
                backgroundColor: darkMode ? 'var(--surface-container-high)' : 'var(--surface-container)',
                color: 'var(--on-surface)',
                border: '1px solid var(--outline-variant)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
              }}
              aria-pressed={darkMode}
            >
              {darkMode ? (
                <>
                  <Moon size={16} aria-hidden="true" />
                  Oscuro
                </>
              ) : (
                <>
                  <Sun size={16} aria-hidden="true" />
                  Claro
                </>
              )}
            </button>
          </SettingRow>
        </SettingsSection>

        {/* Acciones */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="btn-primary flex items-center gap-2"
          >
            <CheckCircle size={16} aria-hidden="true" />
            Guardar cambios
          </button>
          <button
            type="button"
            onClick={resetToDefaults}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Restablecer valores
          </button>
        </div>
      </form>
    </div>
  );
}
