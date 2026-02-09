export const formatDate = (v) => {
  if (!v) return "—";
  // Handles ISO, DD.MM.YYYY, YYYY-MM-DD, and some messy strings
  const s = String(v).trim();
  // Try Date parse first
  const d1 = new Date(s);
  if (!isNaN(d1.getTime())) {
    return d1.toLocaleDateString("en-GB"); // 09/02/2026 style
  }
  // Try DD.MM.YYYY
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const dd = String(m[1]).padStart(2, "0");
    const mm = String(m[2]).padStart(2, "0");
    const yyyy = m[3];
    return `${dd}.${mm}.${yyyy}`;
  }
  return s; // fallback
};

export const formatEuro = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  const n =
    typeof v === "number"
      ? v
      : Number(String(v).replace(/\s/g, "").replace(",", ".").replace("€", ""));
  if (!Number.isFinite(n)) return String(v);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
};

export const formatEuro2 = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  const n =
    typeof v === "number"
      ? v
      : Number(String(v).replace(/\s/g, "").replace(",", ".").replace("€", ""));
  if (!Number.isFinite(n)) return String(v);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
};

export const formatBool = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  const s = String(v).trim().toLowerCase();
  const truthy = ["yes", "true", "1", "y", "jah", "on", "sisaldab"];
  const falsy = ["no", "false", "0", "n", "ei", "off", "ei sisalda"];
  if (truthy.includes(s)) return "Yes";
  if (falsy.includes(s)) return "No";
  // Sometimes Excel has "✓" or "x"
  if (s === "✓" || s === "x") return "Yes";
  return String(v);
};

