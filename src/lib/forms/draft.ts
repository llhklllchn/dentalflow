export type DraftPayload = {
  savedAt: number;
  fields: Record<string, string>;
};

export type DraftFieldEntry = {
  name: string;
  type?: string;
  value?: string;
  checked?: boolean;
};

const UNSUPPORTED_INPUT_TYPES = new Set([
  "button",
  "file",
  "hidden",
  "image",
  "password",
  "reset",
  "submit"
]);

export function buildDraftStorageKey(draftKey: string) {
  return `dentflow:draft:${draftKey}`;
}

export function isSupportedDraftEntry(entry: DraftFieldEntry) {
  const normalizedName = entry.name.trim();

  if (!normalizedName) {
    return false;
  }

  const normalizedType = (entry.type ?? "text").toLowerCase();

  return !UNSUPPORTED_INPUT_TYPES.has(normalizedType);
}

export function collectDraftValues(entries: DraftFieldEntry[]) {
  return entries.reduce<Record<string, string>>((fields, entry) => {
    if (!isSupportedDraftEntry(entry)) {
      return fields;
    }

    const normalizedType = (entry.type ?? "text").toLowerCase();
    const value = entry.value ?? "";

    if (normalizedType === "checkbox" || normalizedType === "radio") {
      if (entry.checked && value.trim()) {
        fields[entry.name] = value;
      }

      return fields;
    }

    if (value.trim()) {
      fields[entry.name] = value;
    }

    return fields;
  }, {});
}

export function shouldRestoreDraftValue(currentValue?: string, savedValue?: string) {
  return Boolean(savedValue?.trim()) && !(currentValue ?? "").trim();
}

export function createDraftPayload(fields: Record<string, string>, savedAt = Date.now()): DraftPayload {
  return {
    savedAt,
    fields
  };
}

export function parseDraftPayload(rawValue: string | null) {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<DraftPayload>;

    if (
      typeof parsed.savedAt !== "number" ||
      !parsed.fields ||
      typeof parsed.fields !== "object" ||
      Array.isArray(parsed.fields)
    ) {
      return null;
    }

    return {
      savedAt: parsed.savedAt,
      fields: Object.entries(parsed.fields).reduce<Record<string, string>>((accumulator, entry) => {
        const [name, value] = entry;

        if (typeof value === "string") {
          accumulator[name] = value;
        }

        return accumulator;
      }, {})
    } satisfies DraftPayload;
  } catch {
    return null;
  }
}
