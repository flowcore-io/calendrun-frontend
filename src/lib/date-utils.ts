/**
 * Format a date as yyyy-mm-dd
 */
export function formatDate(dateInput: string | Date | number): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  // Check if valid date
  if (Number.isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a date as yyyy-mm-dd hh:mm:ss
 */
export function formatDateTime(dateInput: string | Date | number): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  // Check if valid date
  if (Number.isNaN(d.getTime())) return "";

  const datePart = formatDate(d);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${datePart} ${hours}:${minutes}:${seconds}`;
}
