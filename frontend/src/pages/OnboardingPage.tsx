import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Globe, BarChart3, Volume2 } from 'lucide-react';
import { loadSettings, saveSettings } from '../services/api';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type LanguageCode, type LevelCode } from '../types';

/* Idiomas limitados a los soportados por el backend (types/index.ts). */
const LANGUAGES = SUPPORTED_LANGUAGES.map((code) => ({
  code,
  label: LANGUAGE_LABELS[code],
}));

const LEVELS: Array<{ code: LevelCode; label: string }> = [
  { code: 'A1', label: 'Principiante' },
  { code: 'A2', label: 'Elemental' },
  { code: 'B1', label: 'Intermedio' },
  { code: 'B2', label: 'Intermedio alto' },
  { code: 'C1', label: 'Avanzado' },
  { code: 'C2', label: 'Maestría' },
];

/* Voces alineadas con SettingsPage (OpenAI TTS). */
const VOICES = [
  { id: 'alloy', label: 'Alloy (neutral)' },
  { id: 'echo', label: 'Echo (cálida)' },
  { id: 'fable', label: 'Fable (narradora)' },
  { id: 'onyx', label: 'Onyx (grave)' },
  { id: 'nova', label: 'Nova (amigable)' },
  { id: 'shimmer', label: 'Shimmer (suave)' },
];

const STEPS = [
  { icon: Globe, label: 'Idioma' },
  { icon: BarChart3, label: 'Nivel' },
  { icon: Volume2, label: 'Voz' },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<LanguageCode | ''>('');
  const [level, setLevel] = useState<LevelCode | ''>('');
  const [voice, setVoice] = useState('');

  const canContinue = step === 0 ? !!language : step === 1 ? !!level : !!voice;

  function handleContinue() {
    if (step < 2) {
      setStep(step + 1);
    } else if (language && level) {
      /* Fusiona con echo_settings para que el resto de la app lea estos valores. */
      saveSettings({ ...loadSettings(), language, level, voiceId: voice });
      localStorage.setItem('echo_onboarded', 'true');
      navigate('/');
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  const stepTransition = reduceMotion ? { duration: 0 } : { duration: 0.3 };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        className="w-full max-w-md"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.5 }}
      >
        {/* Terminal label */}
        <p className="terminal-label text-center mb-6">
          {`Calibración 0${step + 1} / 03`}
        </p>

        {/* Indicador de progreso */}
        <div className="flex justify-center items-center gap-2 mb-8" aria-hidden="true">
          {STEPS.map((_, i) => (
            <div key={STEPS[i].label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full transition-all"
                style={{
                  backgroundColor: i <= step ? 'var(--primary)' : 'var(--outline-variant)',
                  boxShadow: i === step ? 'var(--shadow-glow)' : 'none',
                  transform: i === step ? 'scale(1.3)' : 'scale(1)',
                }}
              />
              {i < STEPS.length - 1 && (
                <div
                  className="w-8 h-0.5 rounded"
                  style={{
                    backgroundColor: i < step ? 'var(--primary)' : 'var(--outline-variant)',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Panel */}
        <div className="card">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <StepContent key="lang" title="Elige tu idioma" transition={stepTransition}>
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      aria-pressed={language === lang.code}
                      className="flex items-center gap-3 px-4 rounded-lg text-left transition-all"
                      style={{
                        minHeight: 'var(--touch-target)',
                        backgroundColor: language === lang.code ? 'var(--primary-container)' : 'var(--surface-container)',
                        border: language === lang.code ? '2px solid var(--primary)' : '1px solid var(--ghost-border)',
                        boxShadow: language === lang.code ? 'var(--shadow-glow)' : 'none',
                      }}
                    >
                      <span
                        className="text-xs font-semibold uppercase px-1.5 py-0.5 rounded"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: language === lang.code ? 'var(--primary)' : 'var(--surface-container-high)',
                          color: language === lang.code ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                        }}
                        aria-hidden="true"
                      >
                        {lang.code}
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: language === lang.code ? 'var(--primary)' : 'var(--on-surface)' }}
                      >
                        {lang.label}
                      </span>
                    </button>
                  ))}
                </div>
              </StepContent>
            )}

            {step === 1 && (
              <StepContent key="level" title="Selecciona tu nivel" transition={stepTransition}>
                <div className="grid grid-cols-2 gap-3">
                  {LEVELS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLevel(l.code)}
                      aria-pressed={level === l.code}
                      className="flex flex-col items-start px-4 rounded-lg transition-all"
                      style={{
                        minHeight: 'var(--touch-target)',
                        paddingTop: '0.75rem',
                        paddingBottom: '0.75rem',
                        backgroundColor: level === l.code ? 'var(--primary)' : 'var(--surface-container)',
                        border: level === l.code ? 'none' : '1px solid var(--ghost-border)',
                        boxShadow: level === l.code ? 'var(--shadow-glow)' : 'none',
                      }}
                    >
                      <span
                        className="text-sm font-bold"
                        style={{ color: level === l.code ? 'var(--on-primary)' : 'var(--on-surface)' }}
                      >
                        {l.code}
                      </span>
                      <span
                        className="text-xs mt-0.5"
                        style={{ color: level === l.code ? 'var(--on-primary)' : 'var(--on-surface-variant)' }}
                      >
                        {l.label}
                      </span>
                    </button>
                  ))}
                </div>
              </StepContent>
            )}

            {step === 2 && (
              <StepContent key="voice" title="Preferencia de voz" transition={stepTransition}>
                <div className="grid grid-cols-2 gap-3">
                  {VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVoice(v.id)}
                      aria-pressed={voice === v.id}
                      className="flex items-center gap-3 px-4 rounded-lg transition-all"
                      style={{
                        minHeight: 'var(--touch-target)',
                        backgroundColor: voice === v.id ? 'var(--primary-container)' : 'var(--surface-container)',
                        border: voice === v.id ? '2px solid var(--primary)' : '1px solid var(--ghost-border)',
                        boxShadow: voice === v.id ? 'var(--shadow-glow)' : 'none',
                      }}
                    >
                      <Volume2
                        size={20}
                        style={{ color: voice === v.id ? 'var(--primary)' : 'var(--on-surface-variant)' }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: voice === v.id ? 'var(--primary)' : 'var(--on-surface)' }}
                      >
                        {v.label}
                      </span>
                    </button>
                  ))}
                </div>
              </StepContent>
            )}
          </AnimatePresence>

          {/* Navegación */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-1 px-4 rounded-lg text-sm font-medium transition-opacity"
              style={{
                minHeight: 'var(--touch-target)',
                color: 'var(--on-surface-variant)',
                border: '1px solid var(--ghost-border)',
                opacity: step === 0 ? 0.3 : 1,
              }}
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Atrás
            </button>

            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="btn-primary"
            >
              {step === 2 ? 'Empezar' : 'Continuar'}
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StepContent({
  title,
  transition,
  children,
}: {
  title: string;
  transition: { duration: number };
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={transition}
    >
      <h2
        className="text-lg font-bold mb-5"
        style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
      >
        {title}
      </h2>
      {children}
    </motion.div>
  );
}
