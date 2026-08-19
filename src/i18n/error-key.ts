export function resolveErrorKey(key: string): string {
  if (key.startsWith("errors.")) {
    return `eat.errors.${key.slice("errors.".length)}`;
  }
  return key;
}
