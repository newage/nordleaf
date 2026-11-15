// Розмір зображення після зменшення: довша сторона не більша за `max`, пропорції зберігаються
export function computeTargetSize(width: number, height: number, max = 1600): { width: number; height: number; resized: boolean } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height, resized: false };
  const k = max / longest;
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)), resized: true };
}
