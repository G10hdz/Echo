import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Globe, BarChart3, Volume2 } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

const LEVELS = [
  { code: 'A1', label: 'Beginner', description: 'Basic phrases and expressions' },
  { code: 'A2', label: 'Elementary', description: 'Everyday situations' },
  { code: 'B1', label: 'Intermediate', description: 'Clear standard speech' },
  { code: 'B2', label: 'Upper Intermediate', description: 'Complex topics fluently' },
  { code: 'C1', label: 'Advanced', description: 'Demanding, longer texts' },
  { code: 'C2', label: 'Proficient', description: 'Near-native precision' },
];

const VOICES = [
  { id: 'female', label: 'Female Native' },
  { id: 'male', label: 'Male Native' },
];

const STEPS = [
  { icon: Globe, label: 'Language' },
  { icon: BarChart3, label: 'Level' },
  { icon: Volume2, label: 'Voice' },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState('');
  const [level, setLevel] = useState('');
  const [voice, setVoice] = useState('');

  const canContinue = step === 0 ? !!language : step === 1 ? !!level : !!voice;

  function handleContinue() {
    if (step < 2) {
      setStep(step + 1);
    } else {
      localStorage.setItem('echo_onboarding', JSON.stringify({ language, level, voice }));
      localStorage.setItem('echo_onboarded', 'true');
      navigate('/');
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Terminal label */}
        <p
          className="text-xs tracking-[0.2em] uppercase mb-6 text-center opacity-60"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--on-surface-variant)' }}
        >
          {`> CALIBRATION PROTOCOL 0${step + 1} / 03`}
        </p>

        {/* Progress dots */}
        <div className="flex justify-center items-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center gap-2">
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
                    background: i < step
                      ? 'linear-gradient(90deg, var(--primary), var(--accent))'
                      : 'var(--outline-variant)',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Glass panel */}
        <div
          className="rounded-xl p-6 md:p-8"
          style={{
            backgroundColor: 'var(--glass-bg)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <AnimatePresence mode="wait">
            {step === 0 && (
              <StepContent key="lang" title="Choose your language">
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
                      style={{
                        backgroundColor: language === lang.code ? 'var(--primary-container)' : 'var(--surface-container)',
                        border: language === lang.code ? '2px solid var(--primary)' : '1px solid var(--ghost-border)',
                        boxShadow: language === lang.code ? 'var(--shadow-glow)' : 'none',
                      }}
                    >
                      <span className="text-lg">{lang.flag}</span>
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
              <StepContent key="level" title="Select your level">
                <div className="grid grid-cols-2 gap-3">
                  {LEVELS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLevel(l.code)}
                      className="flex flex-col items-start px-4 py-3 rounded-lg transition-all"
                      style={{
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
              <StepContent key="voice" title="Voice preference">
                <div className="flex flex-col gap-3">
                  {VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVoice(v.id)}
                      className="flex items-center gap-4 px-5 py-4 rounded-lg transition-all"
                      style={{
                        backgroundColor: voice === v.id ? 'var(--primary-container)' : 'var(--surface-container)',
                        border: voice === v.id ? '2px solid var(--primary)' : '1px solid var(--ghost-border)',
                        boxShadow: voice === v.id ? 'var(--shadow-glow)' : 'none',
                      }}
                    >
                      <Volume2
                        size={20}
                        style={{ color: voice === v.id ? 'var(--primary)' : 'var(--on-surface-variant)' }}
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

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
              style={{
                color: 'var(--on-surface-variant)',
                border: '1px solid var(--ghost-border)',
                opacity: step === 0 ? 0.3 : 1,
              }}
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <motion.button
              onClick={handleContinue}
              disabled={!canContinue}
              className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all"
              style={{
                background: canContinue
                  ? 'linear-gradient(135deg, var(--primary), var(--accent))'
                  : 'var(--outline-variant)',
                color: canContinue ? 'white' : 'var(--on-surface-variant)',
                boxShadow: canContinue ? 'var(--shadow-md)' : 'none',
              }}
              whileHover={canContinue ? { scale: 1.03 } : {}}
              whileTap={canContinue ? { scale: 0.97 } : {}}
            >
              {step === 2 ? 'FINISH' : 'CONTINUE'}
              <ChevronRight size={16} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StepContent({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
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
