// ============================================================
// ImportSteps.tsx
// ------------------------------------------------------------
// Renders the "1 Upload File — 2 Automated Validation — ..."
// progress indicator. `currentStep` is passed in as a prop
// (currently we'll pass 1 from the page) so this component can
// later be reused/driven dynamically once real upload progress
// exists — it doesn't need to change at all when that happens.
// ============================================================

import { Check } from 'lucide-react';
import type { ImportStep } from '../../types/importData';

interface ImportStepsProps {
  steps: ImportStep[];
  currentStep: number;
}

export default function ImportSteps({ steps, currentStep }: ImportStepsProps) {
  return (
    <div className="import-steps">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = step.id < currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div className="import-step-group" key={step.id}>
            <div className="import-step">
              <span
                className={`import-step-circle ${isActive ? 'active' : ''} ${
                  isComplete ? 'complete' : ''
                }`}
              >
                {isComplete ? <Check size={12} /> : step.id}
              </span>
              <span className={`import-step-label ${isActive ? 'active' : ''}`}>
                {step.label}
              </span>
            </div>

            {/* Don't render a connecting line after the last step */}
            {!isLast && <div className="import-step-line" />}
          </div>
        );
      })}
    </div>
  );
}