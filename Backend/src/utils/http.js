export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

// Express 4 does not catch rejected promises in async handlers; this does.
export const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const pick = (obj, keys) => {
  const out = {};
  for (const k of keys) if (obj && Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  return out;
};

export const cleanString = (value, { max = 500, required = false, label = 'Field' } = {}) => {
  if (value === undefined || value === null) {
    if (required) throw new HttpError(400, `${label} is required.`);
    return '';
  }
  if (typeof value !== 'string') throw new HttpError(400, `${label} must be text.`);
  const s = value.trim();
  if (required && !s) throw new HttpError(400, `${label} is required.`);
  if (s.length > max) throw new HttpError(400, `${label} must be at most ${max} characters.`);
  return s;
};

export const cleanUrl = (value, label = 'URL') => {
  const s = cleanString(value, { max: 2000, label });
  if (!s) return '';
  let u;
  try { u = new URL(s); } catch { throw new HttpError(400, `${label} is not a valid URL.`); }
  if (!['http:', 'https:'].includes(u.protocol)) throw new HttpError(400, `${label} must start with http:// or https://`);
  return u.toString();
};

// Accepts "a, b, c" or ["a", "b", "c"]; trims, drops empties and duplicates.
export const cleanList = (value, { maxItems = 30, maxLen = 50, label = 'List' } = {}) => {
  const arr = typeof value === 'string' ? value.split(',') : value;
  if (!Array.isArray(arr)) throw new HttpError(400, `${label} must be a list.`);
  const out = [...new Set(arr.map(x => {
    if (typeof x !== 'string') throw new HttpError(400, `${label} must only contain text.`);
    return x.trim();
  }).filter(Boolean))];
  if (out.length > maxItems) throw new HttpError(400, `${label} can have at most ${maxItems} items.`);
  if (out.some(x => x.length > maxLen)) throw new HttpError(400, `Each item in ${label} must be at most ${maxLen} characters.`);
  return out;
};

export const cleanBool = value => value === true || value === 'true' || value === '1' || value === 1;

export const cleanEmail = value => {
  const s = cleanString(value, { max: 254, label: 'Email' }).toLowerCase();
  if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new HttpError(400, 'Email is not valid.');
  return s;
};
