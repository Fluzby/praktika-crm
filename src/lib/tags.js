export const normalizeTag = (value) => {
  if (value === null || value === undefined) return "";
  let s = String(value).trim();
  if (!s) return "";

  if (/^types\./i.test(s)) {
    s = s.replace(/^types\./i, "");
    if (s.includes(".")) s = s.split(".").pop() || s;
  }

  s = s.replace(/_/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  return s;
};

export const normalizeTagList = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const tag = normalizeTag(item);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
};

export const parseTagsInput = (text) => {
  const seen = new Set();
  const out = [];
  for (const item of String(text || "").split(",")) {
    const tag = normalizeTag(item);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
};
