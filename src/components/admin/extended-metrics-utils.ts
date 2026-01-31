/**
 * Extended Metrics Utilities
 * Helper functions for extended metrics data
 */

import type { ExtendedMetricsData } from './ExtendedMetricsPanel';

// Check if section has data
export const hasCpuDetails = (data: ExtendedMetricsData) =>
  data.cpuCores !== undefined || data.cpuModelName !== undefined || data.cpuMhz !== undefined;

export const hasSwapData = (data: ExtendedMetricsData) =>
  data.swapTotal !== undefined || data.swapUsed !== undefined || data.swapPercent !== undefined;

export const hasDiskIoData = (data: ExtendedMetricsData) =>
  data.diskReadBytes !== undefined ||
  data.diskWriteBytes !== undefined ||
  data.diskReadRate !== undefined ||
  data.diskIops !== undefined;

export const hasPsiData = (data: ExtendedMetricsData) =>
  data.psiCpuSome !== undefined ||
  data.psiMemorySome !== undefined ||
  data.psiIoSome !== undefined;

export const hasNetworkExtended = (data: ExtendedMetricsData) =>
  data.networkRxPackets !== undefined ||
  data.networkRxErrors !== undefined ||
  data.networkRxDropped !== undefined;

export const hasSocketData = (data: ExtendedMetricsData) =>
  data.socketsUsed !== undefined || data.socketsTcpInUse !== undefined;

export const hasProcessData = (data: ExtendedMetricsData) =>
  data.processesTotal !== undefined || data.processesRunning !== undefined;

export const hasSystemInfo = (data: ExtendedMetricsData) =>
  data.kernelVersion !== undefined ||
  data.hostname !== undefined ||
  data.fileNrAllocated !== undefined ||
  data.entropyAvailable !== undefined;

export const hasVmStats = (data: ExtendedMetricsData) =>
  data.vmPageIn !== undefined || data.vmSwapIn !== undefined || data.vmOomKill !== undefined;

export const hasContextSwitches = (data: ExtendedMetricsData) =>
  data.contextSwitches !== undefined || data.interrupts !== undefined;

/** Check if there's any extended metrics data */
export const hasExtendedMetrics = (data?: ExtendedMetricsData): boolean => {
  if (!data) return false;
  return (
    hasCpuDetails(data) ||
    hasSwapData(data) ||
    hasDiskIoData(data) ||
    hasPsiData(data) ||
    hasNetworkExtended(data) ||
    hasSocketData(data) ||
    hasProcessData(data) ||
    hasSystemInfo(data) ||
    hasVmStats(data) ||
    hasContextSwitches(data)
  );
};
