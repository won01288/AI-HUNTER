"use client";

import { useActionState, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import type { WorknetCode } from "@/lib/worknet";
import { submitStep1, type Step1State } from "./actions";

type InitialValues = {
  regions: string[];
  jobCategories: string[];
  experienceYears: number | null;
  salaryMin: number | null;
  salaryDesired: number | null;
  urgency: string | null;
};

type Step1FormProps = {
  regionCodes: WorknetCode[];
  jobCategoryCodes: WorknetCode[];
  initialValues: InitialValues;
};

const SALARY_MIN_BOUND = 0;
const SALARY_MAX_BOUND = 20000; // 만원 단위, 2억까지
const SALARY_STEP = 100;

const URGENCY_OPTIONS = [
  { value: "immediate", label: "즉시" },
  { value: "within_3m", label: "3개월 내" },
  { value: "open", label: "좋은 기회면" },
];

function toggleCode(list: string[], code: string): string[] {
  return list.includes(code)
    ? list.filter((c) => c !== code)
    : [...list, code];
}

function chipClassName(selected: boolean): string {
  return selected
    ? "rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
    : "rounded-full border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300";
}

const initialState: Step1State = {};

export function Step1Form({
  regionCodes,
  jobCategoryCodes,
  initialValues,
}: Step1FormProps) {
  const [state, formAction, isPending] = useActionState(
    submitStep1,
    initialState
  );

  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    initialValues.regions
  );
  const [selectedJobCategories, setSelectedJobCategories] = useState<
    string[]
  >(initialValues.jobCategories);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([
    initialValues.salaryMin ?? 3000,
    initialValues.salaryDesired ?? 4000,
  ]);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <form
        action={formAction}
        className="w-full max-w-xl space-y-8 rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div>
          <p className="text-sm text-zinc-500">1 / 2단계</p>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            맞춤 채용정보 안내를 위한 기본 정보
          </h1>
        </div>

        {/* 희망 근무지역 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            희망 근무지역 (1개 이상)
          </label>
          <div className="flex flex-wrap gap-2">
            {regionCodes.map((region) => (
              <button
                key={region.code}
                type="button"
                className={chipClassName(
                  selectedRegions.includes(region.code)
                )}
                onClick={() =>
                  setSelectedRegions((prev) => toggleCode(prev, region.code))
                }
              >
                {region.name}
              </button>
            ))}
          </div>
          <input
            type="hidden"
            name="regions"
            value={JSON.stringify(selectedRegions)}
          />
        </div>

        {/* 직무 대분류 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            직무 대분류 (1개 이상)
          </label>
          <div className="flex flex-wrap gap-2">
            {jobCategoryCodes.map((jobCategory) => (
              <button
                key={jobCategory.code}
                type="button"
                className={chipClassName(
                  selectedJobCategories.includes(jobCategory.code)
                )}
                onClick={() =>
                  setSelectedJobCategories((prev) =>
                    toggleCode(prev, jobCategory.code)
                  )
                }
              >
                {jobCategory.name}
              </button>
            ))}
          </div>
          <input
            type="hidden"
            name="jobCategories"
            value={JSON.stringify(selectedJobCategories)}
          />
        </div>

        {/* 총 경력 */}
        <div className="space-y-1">
          <label
            htmlFor="experienceYears"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            총 경력 연차 (0 = 신입)
          </label>
          <input
            id="experienceYears"
            name="experienceYears"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={initialValues.experienceYears ?? 0}
            className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>

        {/* 희망 연봉 범위 */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            희망 연봉 범위 (만원)
          </label>

          <Slider.Root
            className="relative flex h-5 w-full touch-none select-none items-center"
            min={SALARY_MIN_BOUND}
            max={SALARY_MAX_BOUND}
            step={SALARY_STEP}
            minStepsBetweenThumbs={1}
            value={salaryRange}
            onValueChange={(value) =>
              setSalaryRange(value as [number, number])
            }
          >
            <Slider.Track className="relative h-1.5 grow rounded-full bg-zinc-200 dark:bg-zinc-800">
              <Slider.Range className="absolute h-full rounded-full bg-zinc-900 dark:bg-zinc-50" />
            </Slider.Track>
            <Slider.Thumb
              aria-label="최소 연봉"
              className="block h-4 w-4 rounded-full bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-50"
            />
            <Slider.Thumb
              aria-label="희망 연봉"
              className="block h-4 w-4 rounded-full bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-50"
            />
          </Slider.Root>

          <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="number"
              min={SALARY_MIN_BOUND}
              max={salaryRange[1]}
              step={SALARY_STEP}
              value={salaryRange[0]}
              onChange={(e) =>
                setSalaryRange([Number(e.target.value), salaryRange[1]])
              }
              className="w-24 rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <span>만원 ~</span>
            <input
              type="number"
              min={salaryRange[0]}
              max={SALARY_MAX_BOUND}
              step={SALARY_STEP}
              value={salaryRange[1]}
              onChange={(e) =>
                setSalaryRange([salaryRange[0], Number(e.target.value)])
              }
              className="w-24 rounded-md border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <span>만원</span>
          </div>

          <input type="hidden" name="salaryMin" value={salaryRange[0]} />
          <input
            type="hidden"
            name="salaryDesired"
            value={salaryRange[1]}
          />
        </div>

        {/* 이직 긴급도 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            이직 긴급도
          </label>
          <div className="flex flex-wrap gap-4">
            {URGENCY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <input
                  type="radio"
                  name="urgency"
                  value={option.value}
                  required
                  defaultChecked={initialValues.urgency === option.value}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {isPending ? "저장 중..." : "다음"}
        </button>
      </form>
    </div>
  );
}
