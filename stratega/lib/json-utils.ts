// Utility functions for working with JSON strings stored in SQLite

export function parseJsonArray<T = string>(jsonString: string | null | undefined): T[] {
  if (!jsonString) return []
  try {
    const parsed = JSON.parse(jsonString)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function stringifyJsonArray<T = string>(array: T[] | null | undefined): string | null {
  if (!array || array.length === 0) return null
  try {
    return JSON.stringify(array)
  } catch {
    return null
  }
}

