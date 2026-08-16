import React from 'react';
import { 
  CheckCircle2, 
  Scissors, 
  Zap, 
  Paintbrush, 
  PackageCheck, 
  Clock, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { OrderStatus } from '../../types';

export type FabricationStage = 'accepted' | 'material_cut' | 'welding' | 'painting' | 'ready' | 'delivered';

interface FabricationTimelineProps {
  currentStage?: FabricationStage | string;
  orderStatus?: OrderStatus;
  isAdmin?: boolean;
  onUpdateStage?: (newStage: FabricationStage) => void;
  updatedAt?: string;
}

export const FABRICATION_STAGES: {
  key: FabricationStage;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  progressPercent: number;
}[] = [
  {
    key: 'accepted',
    label: '1. Order Accepted',
    sublabel: 'Specs verified & queued for workshop',
    icon: CheckCircle2,
    progressPercent: 20
  },
  {
    key: 'material_cut',
    label: '2. Steel Material Cut',
    sublabel: 'MS Pipes & Angle Irons cut to length',
    icon: Scissors,
    progressPercent: 40
  },
  {
    key: 'welding',
    label: '3. Lathe & Welding Work',
    sublabel: 'Precision turning, welding & grinding',
    icon: Zap,
    progressPercent: 60
  },
  {
    key: 'painting',
    label: '4. Painting & Finishing',
    sublabel: 'Anti-rust primer & protective paint coat',
    icon: Paintbrush,
    progressPercent: 80
  },
  {
    key: 'ready',
    label: '5. Ready & Dispatched',
    sublabel: 'Quality checked & ready for handover',
    icon: PackageCheck,
    progressPercent: 100
  }
];

export const FabricationTimeline: React.FC<FabricationTimelineProps> = ({
  currentStage,
  orderStatus,
  isAdmin = false,
  onUpdateStage,
  updatedAt
}) => {
  // Map OrderStatus to FabricationStage if stage not set
  const resolveCurrentStageIndex = (): number => {
    if (currentStage) {
      const idx = FABRICATION_STAGES.findIndex(s => s.key === currentStage);
      if (idx >= 0) return idx;
    }

    if (orderStatus === 'delivered') return 4;
    if (orderStatus === 'ready') return 4;
    if (orderStatus === 'processing') return 2;
    if (orderStatus === 'order_confirmed' || orderStatus === 'accepted') return 0;
    return 0;
  };

  const currentIndex = resolveCurrentStageIndex();
  const currentStageObj = FABRICATION_STAGES[currentIndex];
  const progressPercent = currentStageObj.progressPercent;

  return (
    <div className="bg-white rounded-3xl p-6 border-2 border-brand-500/20 shadow-card space-y-6">
      
      {/* Header & Overall Progress Bar */}
      <div className="space-y-3 border-b border-warm-muted pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600 animate-pulse" />
            <div>
              <h3 className="text-base font-black text-charcoal-900">
                Workshop Fabrication Progress Timeline
              </h3>
              <p className="text-xs text-charcoal-500 font-semibold">
                Live step-by-step steel cutting, lathe turning & welding updates
              </p>
            </div>
          </div>

          <div className="bg-brand-50 border border-brand-200 text-brand-900 px-3.5 py-1.5 rounded-2xl text-xs font-black self-start sm:self-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping"></span>
            <span>{progressPercent}% Completed</span>
          </div>
        </div>

        {/* Visual Progress Bar Slider */}
        <div className="w-full bg-warm-bg h-3 rounded-full overflow-hidden border border-warm-border p-0.5">
          <div 
            className="bg-gradient-to-r from-amber-500 via-brand-500 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step-by-Step Milestones Timeline Display */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {FABRICATION_STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <div
              key={stage.key}
              onClick={() => isAdmin && onUpdateStage && onUpdateStage(stage.key)}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 relative ${
                isAdmin ? 'cursor-pointer hover:shadow-md' : ''
              } ${
                isCurrent
                  ? 'bg-amber-50/90 border-2 border-brand-500 shadow-md scale-[1.02]'
                  : isDone
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-warm-bg/50 border-warm-border opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl border ${
                  isCurrent
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : isDone
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-charcoal-400 border-warm-border'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                {isDone && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    ✓ Done
                  </span>
                )}
                {isCurrent && (
                  <span className="text-[10px] font-black text-brand-800 bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                    Active Step
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                <h4 className={`text-xs font-black ${isCurrent ? 'text-brand-950' : 'text-charcoal-900'}`}>
                  {stage.label}
                </h4>
                <p className="text-[10px] font-medium text-charcoal-600 leading-snug">
                  {stage.sublabel}
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStage && onUpdateStage(stage.key);
                  }}
                  className={`mt-2 py-1 px-2 rounded-lg text-[10px] font-black w-full border text-center transition-colors ${
                    isCurrent 
                      ? 'bg-brand-600 text-white border-brand-600' 
                      : 'bg-white text-charcoal-700 border-warm-border hover:bg-brand-50'
                  }`}
                >
                  {isCurrent ? 'Current Stage' : 'Set as Current Stage'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin Fast Stage Switcher Bar */}
      {isAdmin && onUpdateStage && (
        <div className="pt-3 border-t border-warm-muted space-y-2">
          <label className="block text-[11px] font-black text-charcoal-800 uppercase tracking-wider">
            Admin Fast Update Workshop Stage:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {FABRICATION_STAGES.map((stage) => (
              <button
                key={stage.key}
                type="button"
                onClick={() => onUpdateStage(stage.key)}
                className={`py-1.5 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                  stage.key === currentStageObj.key
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-warm-bg text-charcoal-700 border-warm-border hover:bg-amber-50'
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
