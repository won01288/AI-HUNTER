"use client";

import { useActionState, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { submitStep2, type Step2State } from "./actions";

type InitialValues = {
  companySize: string[];
  exclusions: string[];
  weights: {
    region: number;
    salary: number;
    job: number;
    companySize: number;
  };
};

type Step2FormProps = {
  initialValues: InitialValues;
};

const COMPANY_SIZE_OPTIONS = [
  { value: "large", label: "대기업" },
  { value: "mid", label: "중견기업" },
  { value: "small", label: "중소기업" },
  { value: "startup", label: "스타트업" },
];

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function chipClassName(selected: boolean): string {
  return selected
    ? "rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-paper"
    : "rounded-full border border-line px-3 py-1.5 text-sm text-ink";
}

const initialState: Step2State = {};

export function Step2Form({ initialValues }: Step2FormProps) {
  const [state, formAction, isPending] = useActionState(
    submitStep2,
    initialState
  );

  const [companySize, setCompanySize] = useState<string[]>(
    initialValues.companySize
  );

  const [exclusionInput, setExclusionInput] = useState("");
  const [exclusions, setExclusions] = useState<string[]>(
    initialValues.exclusions
  );

  const [weights, setWeights] = useState(initialValues.weights);
  const weightSum =
    weights.region + weights.salary + weights.job + weights.companySize;

  function addExclusion() {
    const tag = exclusionInput.trim();
    if (tag.length === 0 || exclusions.includes(tag)) {
      setExclusionInput("");
      return;
    }
    setExclusions((prev) => [...prev, tag]);
    setExclusionInput("");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-paper px-4 py-16">
      <form
        action={formAction}
        className="w-full max-w-xl space-y-8 rounded-card border border-line bg-white p-8 shadow-[0_2px_12px_rgba(20,33,61,0.06)]"
      >
        <div>
          <p className="text-sm text-slate">2 / 2단계 (선택)</p>
          <h1 className="font-display text-xl font-bold text-ink">
            더 정확한 맞춤 채용정보 안내를 위한 추가 정보
          </h1>
        </div>

        {/* 기업 규모 선호 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">
            선호 기업 규모 (선택)
          </label>
          <div className="flex flex-wrap gap-2">
            {COMPANY_SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={chipClassName(companySize.includes(option.value))}
                onClick={() =>
                  setCompanySize((prev) => toggleValue(prev, option.value))
                }
              >
                {option.label}
              </button>
            ))}
          </div>
          <input
            type="hidden"
            name="companySize"
            value={JSON.stringify(companySize)}
          />
        </div>

        {/* 우선순위 가중치 */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-medium text-ink">
              우선순위 가중치 (합 100)
            </label>
            <span
              className={
                weightSum === 100
                  ? "font-mono text-sm text-slate"
                  : "font-mono text-sm font-medium text-red-600"
              }
            >
              합계 {weightSum} / 100
            </span>
          </div>

          {(
            [
              { key: "region", label: "지역" },
              { key: "salary", label: "연봉" },
              { key: "job", label: "직무" },
              { key: "companySize", label: "기업 규모" },
            ] as const
          ).map((criterion) => (
            <div key={criterion.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm text-ink">
                <span>{criterion.label}</span>
                <span className="font-mono">{weights[criterion.key]}</span>
              </div>
              <Slider.Root
                className="relative flex h-5 w-full touch-none select-none items-center"
                min={0}
                max={100}
                step={5}
                value={[weights[criterion.key]]}
                onValueChange={([value]) =>
                  setWeights((prev) => ({ ...prev, [criterion.key]: value }))
                }
              >
                <Slider.Track className="relative h-1.5 grow rounded-full bg-line">
                  <Slider.Range className="absolute h-full rounded-full bg-ink" />
                </Slider.Track>
                <Slider.Thumb
                  aria-label={`${criterion.label} 가중치`}
                  className="block h-4 w-4 rounded-full bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
                />
              </Slider.Root>
            </div>
          ))}

          <input type="hidden" name="weightRegion" value={weights.region} />
          <input type="hidden" name="weightSalary" value={weights.salary} />
          <input type="hidden" name="weightJob" value={weights.job} />
          <input
            type="hidden"
            name="weightCompanySize"
            value={weights.companySize}
          />
        </div>

        {/* 제외 조건 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink">
            제외하고 싶은 산업/기업 (선택)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={exclusionInput}
              onChange={(e) => setExclusionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addExclusion();
                }
              }}
              placeholder="예: 콜센터, OO기업"
              className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
            />
            <button
              type="button"
              onClick={addExclusion}
              className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
            >
              추가
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {exclusions.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-paper px-3 py-1 text-sm text-ink"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`${tag} 제거`}
                  onClick={() =>
                    setExclusions((prev) => prev.filter((t) => t !== tag))
                  }
                  className="text-slate hover:text-ink"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="hidden"
            name="exclusions"
            value={JSON.stringify(exclusions)}
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || weightSum !== 100}
          className="w-full rounded-lg bg-ink px-5 py-2.5 font-medium text-paper disabled:opacity-50"
        >
          {isPending ? "저장 중..." : "저장하고 완료"}
        </button>
      </form>
    </div>
  );
}
