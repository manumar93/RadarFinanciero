function toNum(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  const parsed = Number(value.replace("%", "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function splitSymbols(input) {
  return [
    ...new Set(
      (input || "")
        .split(",")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean)
    ),
  ];
}

function compactText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasUsableName(value) {
  return typeof value === "string" && value.trim() && value.trim() !== "-";
}

function normalizeText(input) {
  return compactText(input).toLowerCase();
}

module.exports = {
  toNum,
  splitSymbols,
  compactText,
  hasUsableName,
  normalizeText,
};
