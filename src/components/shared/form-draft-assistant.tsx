"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildDraftStorageKey,
  collectDraftValues,
  createDraftPayload,
  parseDraftPayload,
  shouldRestoreDraftValue
} from "@/lib/forms/draft";

type FormDraftAssistantProps = {
  draftKey: string;
};

type SupportedFormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isSupportedFormElement(element: Element): element is SupportedFormElement {
  if (
    !(
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement
    )
  ) {
    return false;
  }

  return Boolean(element.name);
}

function readFormEntries(form: HTMLFormElement) {
  return Array.from(form.elements)
    .filter(isSupportedFormElement)
    .map((element) => ({
      name: element.name,
      type: element instanceof HTMLInputElement ? element.type : element.tagName.toLowerCase(),
      value: element.value,
      checked: element instanceof HTMLInputElement ? element.checked : undefined
    }));
}

function restoreDraftIntoForm(form: HTMLFormElement, fields: Record<string, string>) {
  let restoredCount = 0;

  for (const element of Array.from(form.elements).filter(isSupportedFormElement)) {
    const savedValue = fields[element.name];

    if (!savedValue) {
      continue;
    }

    if (element instanceof HTMLInputElement) {
      const normalizedType = element.type.toLowerCase();

      if (normalizedType === "checkbox" || normalizedType === "radio") {
        if (!element.checked && element.value === savedValue) {
          element.checked = true;
          restoredCount += 1;
        }

        continue;
      }
    }

    if (shouldRestoreDraftValue(element.value, savedValue)) {
      element.value = savedValue;
      restoredCount += 1;
    }
  }

  return restoredCount;
}

function formatSavedAt(savedAt: number) {
  return new Intl.DateTimeFormat("ar-JO", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short"
  }).format(new Date(savedAt));
}

export function FormDraftAssistant({ draftKey }: FormDraftAssistantProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const hasPendingChangesRef = useRef(false);
  const storageKey = useMemo(() => buildDraftStorageKey(draftKey), [draftKey]);
  const [hasDraft, setHasDraft] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [restoredCount, setRestoredCount] = useState(0);

  useEffect(() => {
    const form = markerRef.current?.closest("form");

    if (!form || typeof window === "undefined") {
      return;
    }

    const payload = parseDraftPayload(window.localStorage.getItem(storageKey));

    let initialSnapshotTimeout: number | null = null;
    let saveTimeout: number | null = null;

    if (payload) {
      const restoredFields = restoreDraftIntoForm(form, payload.fields);

      initialSnapshotTimeout = window.setTimeout(() => {
        setHasDraft(Object.keys(payload.fields).length > 0);
        setSavedAt(payload.savedAt);
        setRestoredCount(restoredFields);
      }, 0);
    }

    const persistDraft = () => {
      const fields = collectDraftValues(readFormEntries(form));

      if (Object.keys(fields).length === 0) {
        window.localStorage.removeItem(storageKey);
        setHasDraft(false);
        setSavedAt(null);
        return;
      }

      const nextPayload = createDraftPayload(fields);
      window.localStorage.setItem(storageKey, JSON.stringify(nextPayload));
      setHasDraft(true);
      setSavedAt(nextPayload.savedAt);
    };

    const handleFieldChange = () => {
      hasPendingChangesRef.current = true;

      if (saveTimeout) {
        window.clearTimeout(saveTimeout);
      }

      saveTimeout = window.setTimeout(() => {
        persistDraft();
      }, 250);
    };

    const handleSubmit = () => {
      hasPendingChangesRef.current = false;
      window.localStorage.removeItem(storageKey);
      setHasDraft(false);
      setSavedAt(null);
      setRestoredCount(0);
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPendingChangesRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    form.addEventListener("input", handleFieldChange, true);
    form.addEventListener("change", handleFieldChange, true);
    form.addEventListener("submit", handleSubmit);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (initialSnapshotTimeout) {
        window.clearTimeout(initialSnapshotTimeout);
      }

      if (saveTimeout) {
        window.clearTimeout(saveTimeout);
      }

      form.removeEventListener("input", handleFieldChange, true);
      form.removeEventListener("change", handleFieldChange, true);
      form.removeEventListener("submit", handleSubmit);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [storageKey]);

  const handleClearDraft = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(storageKey);
    hasPendingChangesRef.current = false;
    setHasDraft(false);
    setSavedAt(null);
    setRestoredCount(0);
  };

  return (
    <div
      ref={markerRef}
      className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-ink">حماية الإدخال الذكية</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            هذا النموذج يحفظ مسودة محلية على هذا الجهاز فقط ويعيدها إذا انقطع العمل قبل
            الحفظ النهائي.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearDraft}
          className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          مسح المسودة
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">
          {hasDraft ? "المسودة المحلية مفعلة" : "سيبدأ الحفظ المحلي بعد أول تعديل"}
        </span>
        {savedAt ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
            آخر حفظ محلي {formatSavedAt(savedAt)}
          </span>
        ) : null}
        {restoredCount > 0 ? (
          <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-brand-800">
            تمت استعادة {restoredCount} حقول من آخر مسودة
          </span>
        ) : null}
      </div>
    </div>
  );
}
