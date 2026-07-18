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
    ? "rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
    : "rounded-full border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300";
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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <form
        action={formAction}
        className="w-full max-w-xl space-y-8 rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div>
          <p className="text-sm text-zinc-500">2 / 2단계 (선택)</p>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            더 정확한 맞춤 채용정보 안내를 위한 추가 정보
          </h1>
        </div>

        {/* 기업 규모 선호 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              우선순위 가중치 (합 100)
            </label>
            <span
              className={
                weightSum === 100
                  ? "text-sm text-zinc-500"
                  : "text-sm font-medium text-red-600"
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
              <div className="flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-300">
                <span>{criterion.label}</span>
                <span>{weights[criterion.key]}</span>
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
                <Slider.Track className="relative h-1.5 grow rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <Slider.Range className="absolute h-full rounded-full bg-zinc-900 dark:bg-zinc-50" />
                </Slider.Track>
                <Slider.Thumb
                  aria-label={`${criterion.label} 가중치`}
                  className="block h-4 w-4 rounded-full bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-50"
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
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <button
              type="button"
              onClick={addExclusion}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              추가
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {exclusions.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`${tag} 제거`}
                  onClick={() =>
                    setExclusions((prev) => prev.filter((t) => t !== tag))
                  }
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {isPending ? "저장 중..." : "저장하고 완료"}
        </button>
      </form>
    </div>
  );
}
