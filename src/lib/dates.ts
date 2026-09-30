// Date parsing shared by the pages and the content schemas. It has no imports, so Node scripts can load
// it through schemas.ts.

/**
 * Parses a flexible date string into a Date. Accepts "Jan 2020"/"January 2020", "2020-01"/"2020/01",
 * "Present"/"current" (resolved to now), or anything the native Date constructor understands.
 * Returns an invalid Date (NaN time) if none of these apply.
 * @param dateStr - the date string to parse.
 */
export function parseFlexibleDate(dateStr: string): Date {
  if (dateStr.toLowerCase().includes("present") || dateStr.toLowerCase().includes("current")) {
    return new Date()
  }

  // Format: "Jan 2020", "January 2020"
  const monthYearMatch = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/)
  if (monthYearMatch) {
    return new Date(`${monthYearMatch[1]} 1, ${monthYearMatch[2]}`)
  }

  // Format: "2020-01", "2020/01"
  const dashMatch = dateStr.match(/^(\d{4})[-/](\d{2})$/)
  if (dashMatch) {
    return new Date(parseInt(dashMatch[1]), parseInt(dashMatch[2]) - 1, 1)
  }

  // Fallback to Date constructor
  return new Date(dateStr)
}
