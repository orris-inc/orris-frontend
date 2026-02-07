/**
 * Check if a port is within the allowed port range.
 * Range format: "1000-2000,3000,4000-5000"
 */
export const isPortInAllowedRange = (
  port: number,
  allowedPortRange: string | undefined,
): boolean => {
  if (!allowedPortRange || allowedPortRange.trim() === "") {
    return true;
  }

  const parts = allowedPortRange.split(",").map((p) => p.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end) && port >= start && port <= end) {
        return true;
      }
    } else {
      const singlePort = parseInt(part, 10);
      if (!isNaN(singlePort) && port === singlePort) {
        return true;
      }
    }
  }
  return false;
};
