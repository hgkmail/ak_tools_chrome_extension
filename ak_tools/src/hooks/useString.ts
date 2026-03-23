export function strAddBackslash(str: string) {
  return str
    .replace(/\\/g, '\\\\') // Escape existing backslashes first
    .replace(/"/g, '\\"') // Escape double quotes
}

export function strRemoveBackslash(str: string) {
  return str.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
}
