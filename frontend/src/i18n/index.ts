import en from './locales/en.json';

export type SupportedLocale = 'en' | 'hi' | 'mr' | 'bn' | 'gu' | 'pa' | 'ta' | 'te' | 'kn' | 'ml';

// In-memory dictionary cache for loaded locales (English is pre-loaded as baseline)
export const LOADED_LOCALES: Record<SupportedLocale, Record<string, any> | undefined> = {
  en,
  hi: undefined,
  mr: undefined,
  bn: undefined,
  gu: undefined,
  pa: undefined,
  ta: undefined,
  te: undefined,
  kn: undefined,
  ml: undefined,
};

// Dynamic loaders for on-demand dictionary chunk splitting
const LOCALE_LOADERS: Record<SupportedLocale, () => Promise<{ default: Record<string, any> }>> = {
  en: () => Promise.resolve({ default: en }),
  hi: () => import('./locales/hi.json'),
  mr: () => import('./locales/mr.json'),
  bn: () => import('./locales/bn.json'),
  gu: () => import('./locales/gu.json'),
  pa: () => import('./locales/pa.json'),
  ta: () => import('./locales/ta.json'),
  te: () => import('./locales/te.json'),
  kn: () => import('./locales/kn.json'),
  ml: () => import('./locales/ml.json'),
};

const IN_FLIGHT_LOADS = new Map<SupportedLocale, Promise<Record<string, any>>>();

export async function loadLocale(lang: string): Promise<Record<string, any>> {
  const targetLocale = (lang in LOCALE_LOADERS ? lang : 'en') as SupportedLocale;
  
  if (LOADED_LOCALES[targetLocale]) {
    return LOADED_LOCALES[targetLocale]!;
  }

  if (IN_FLIGHT_LOADS.has(targetLocale)) {
    return IN_FLIGHT_LOADS.get(targetLocale)!;
  }

  const loadPromise = LOCALE_LOADERS[targetLocale]()
    .then((mod) => {
      const dict = mod.default || mod;
      LOADED_LOCALES[targetLocale] = dict;
      IN_FLIGHT_LOADS.delete(targetLocale);
      return dict;
    })
    .catch((err) => {
      console.warn(`[i18n] Failed to load locale '${targetLocale}', falling back to 'en':`, err);
      IN_FLIGHT_LOADS.delete(targetLocale);
      return en;
    });

  IN_FLIGHT_LOADS.set(targetLocale, loadPromise);
  return loadPromise;
}

export function isLocaleLoaded(lang: string): boolean {
  const targetLocale = (lang in LOADED_LOCALES ? lang : 'en') as SupportedLocale;
  return LOADED_LOCALES[targetLocale] !== undefined;
}

// Backward-compatible dictionary accessor
export const LOCALES = new Proxy(LOADED_LOCALES as Record<SupportedLocale, Record<string, any>>, {
  get(target, prop: string) {
    const locale = prop as SupportedLocale;
    return target[locale] || target.en;
  }
});

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function resolveProperty(obj: any, prop: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  if (prop in obj) return obj[prop];
  
  const camel = toCamelCase(prop);
  if (camel in obj) return obj[camel];
  
  const snake = toSnakeCase(prop);
  if (snake in obj) return obj[snake];

  const upper = prop.toUpperCase();
  if (upper in obj) return obj[upper];

  const lower = prop.toLowerCase();
  if (lower in obj) return obj[lower];

  return undefined;
}

function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  if (!obj) return undefined;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    current = resolveProperty(current, part);
    if (current === undefined || current === null) {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function formatTranslation(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{{1,2}(\w+)\}{1,2}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

export function translate(
  lang: string,
  key: string,
  params?: Record<string, string | number>
): string {
  const targetLocale = (lang in LOADED_LOCALES ? lang : 'en') as SupportedLocale;
  const dict = LOADED_LOCALES[targetLocale];
  const fallbackDict = LOADED_LOCALES.en || en;

  // Try target language
  let val = dict ? getNestedValue(dict, key) : undefined;

  // Fallback to English
  if (val === undefined && targetLocale !== 'en') {
    val = getNestedValue(fallbackDict, key);
  }

  // Fallback to raw key if missing
  if (val === undefined) {
    val = key;
  }

  return formatTranslation(val, params);
}

export const t = translate;
