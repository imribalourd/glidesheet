interface Style {
  [key: string]: string;
}

const cache = new WeakMap<HTMLElement, Style>();

export function set(
  el: Element | HTMLElement | null | undefined,
  styles: Style,
  ignoreCache = false,
) {
  if (!el || !(el instanceof HTMLElement)) return;
  const originalStyles: Style = {};

  Object.entries(styles).forEach(([key, value]) => {
    if (key.startsWith('--')) {
      el.style.setProperty(key, value);
      return;
    }
    originalStyles[key] = (el.style as any)[key];
    (el.style as any)[key] = value;
  });

  if (ignoreCache) return;
  cache.set(el, originalStyles);
}

export function reset(el: Element | HTMLElement | null, prop?: string) {
  if (!el || !(el instanceof HTMLElement)) return;
  const originalStyles = cache.get(el);
  if (!originalStyles) return;

  if (prop) {
    (el.style as any)[prop] = originalStyles[prop];
  } else {
    Object.entries(originalStyles).forEach(([key, value]) => {
      (el.style as any)[key] = value;
    });
  }
}
