const REDACTED = "[REDACTED]" as const;

const SENSITIVE_KEY_PATTERN = /^(?:password|secret|authorization|cookie|access[_-]?token|refresh[_-]?token|private[_-]?key|radius[_-]?secret)$/i;

export function redactSecrets(value: unknown): unknown {
  return redactValue(value, new WeakSet<object>());
}

function redactValue(value: unknown, seen: WeakSet<object>): unknown {
  if (Array.isArray(value)) {
    if (seen.has(value)) return "[CIRCULAR]";
    seen.add(value);
    const result = value.map((item) => redactValue(item, seen));
    seen.delete(value);
    return result;
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);

  const output: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    output[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? REDACTED
      : redactValue(nestedValue, seen);
  }

  seen.delete(value);
  return output;
}
