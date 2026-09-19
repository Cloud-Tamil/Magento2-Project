import React, { useState } from 'react';
import { CheckCircle2, Play, Terminal, ArrowRight, ShieldCheck, Zap, Copy, Check } from 'lucide-react';
import { AUTOMATION_STEPS } from '../data/projectData';

export const AutomationTimeline: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Intro Box */}
      <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-2xs">
        <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs uppercase tracking-wider">
          <Zap className="w-4 h-4" />
          Zero-Touch Autonomous Execution
        </div>
        <h2 className="text-xl font-bold text-stone-900 tracking-tight mt-1">
          Automated End-to-End Installation Lifecycle
        </h2>
        <p className="text-sm text-stone-600 mt-1 max-w-3xl">
          When you execute <code>docker compose up -d --build</code>, MageForge executes a 10-step unattended orchestration pipeline inside the <code>php-cli</code> container without requiring manual input.
        </p>
      </div>

      {/* Interactive Pipeline Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step Selector Column */}
        <div className="lg:col-span-5 space-y-2">
          {AUTOMATION_STEPS.map((item) => {
            const isCurrent = activeStep === item.step;
            return (
              <button
                key={item.step}
                id={`timeline-step-${item.step}`}
                onClick={() => setActiveStep(item.step)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isCurrent
                    ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-white border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    isCurrent
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-100 text-stone-600 border border-stone-300'
                  }`}
                >
                  {item.step}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-bold ${isCurrent ? 'text-amber-950' : 'text-stone-800'}`}>
                    {item.title}
                  </div>
                  <div className="text-[11px] text-stone-500 truncate font-mono mt-0.5">
                    {item.command}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step Detail Column */}
        <div className="lg:col-span-7">
          {(() => {
            const current = AUTOMATION_STEPS.find((s) => s.step === activeStep)!;
            return (
              <div className="bg-stone-900 rounded-xl p-6 border border-stone-800 text-stone-100 h-full flex flex-col justify-between shadow-md">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                    <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                      Pipeline Phase {current.step} of 10
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                      Target: {current.container}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{current.title}</h3>
                  <p className="text-sm text-stone-300 leading-relaxed">{current.description}</p>

                  {/* Purpose Box */}
                  <div className="p-3.5 bg-stone-950/80 rounded-lg border border-stone-800 text-xs space-y-1">
                    <span className="font-semibold text-amber-400">Architectural Objective:</span>
                    <p className="text-stone-300">{current.purpose}</p>
                  </div>

                  {/* Command Snippet */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs text-stone-400">
                      <span className="font-mono text-[11px]">Command Script</span>
                      <button
                        id="copy-step-cmd-btn"
                        onClick={() => handleCopy(current.command)}
                        className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer"
                      >
                        {copiedCmd === current.command ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Command</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 bg-black/60 rounded-lg font-mono text-xs text-emerald-400 border border-stone-800 overflow-x-auto">
                      $ {current.command}
                    </div>
                  </div>
                </div>

                {/* Next / Previous Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-stone-800/80 mt-6">
                  <button
                    onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                    disabled={activeStep === 1}
                    className="px-3 py-1.5 text-xs font-semibold rounded bg-stone-800 hover:bg-stone-700 text-stone-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    Previous Phase
                  </button>
                  <span className="text-xs font-mono text-stone-500">{activeStep} / 10</span>
                  <button
                    onClick={() => setActiveStep((prev) => Math.min(10, prev + 1))}
                    disabled={activeStep === 10}
                    className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    Next Phase
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
