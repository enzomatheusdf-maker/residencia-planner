function clamp(value, min, max) {
  let next = value;
  if (typeof min === "number") next = Math.max(min, next);
  if (typeof max === "number") next = Math.min(max, next);
  return next;
}

function normalizeDecimalSeparator(value, allowDecimal) {
  if (!allowDecimal) return value;
  return value.replace(/,/g, ".");
}

export function sanitizeNumericInput(rawValue, options = {}) {
  const {
    allowDecimal = false,
    maxDecimals = allowDecimal ? 2 : 0,
    min,
    max,
  } = options;

  const source = normalizeDecimalSeparator(String(rawValue ?? "").replace(/[oO]/g, "0"), allowDecimal);
  const digitCount = [...source].filter((char) => char >= "0" && char <= "9").length;
  let text = "";
  let hasDecimal = false;

  for (const char of source) {
    if (char >= "0" && char <= "9") {
      text += char;
      continue;
    }

    if (allowDecimal && char === "." && !hasDecimal) {
      text += ".";
      hasDecimal = true;
    }
  }

  if (allowDecimal && text.startsWith(".")) {
    text = `0${text}`;
  }

  if (allowDecimal && Number.isInteger(maxDecimals) && maxDecimals >= 0 && text.includes(".")) {
    const [whole, decimals] = text.split(".");
    text = `${whole}.${decimals.slice(0, maxDecimals)}`;
  }

  if (!allowDecimal) {
    text = text.replace(/\./g, "");
  }

  if (digitCount === 0 || text === "" || text === ".") {
    return { text: "", value: null, isEmpty: true };
  }

  const numeric = allowDecimal ? Number.parseFloat(text) : Number.parseInt(text, 10);
  if (!Number.isFinite(numeric)) {
    return { text: "", value: null, isEmpty: true };
  }

  const value = clamp(numeric, min, max);
  const normalizedText = allowDecimal
    ? String(value).replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1")
    : String(Math.trunc(value));

  return {
    text: normalizedText,
    value,
    isEmpty: false,
  };
}

export function readSanitizedNumber(rawValue, options = {}) {
  return sanitizeNumericInput(rawValue, options).value;
}
