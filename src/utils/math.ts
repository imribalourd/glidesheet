export function dampenValue(v: number) {
  return 8 * (Math.log(v + 1) - 2);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
