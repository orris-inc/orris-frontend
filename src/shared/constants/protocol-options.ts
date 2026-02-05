/**
 * Protocol Configuration Constants
 * Centralized protocol options for node configuration
 *
 * These constants are used across Create/Edit Node dialogs and sheets.
 * Types are imported from API to ensure consistency.
 */

import type {
  TransportProtocol,
  VLESSSecurity,
  VMessSecurity,
  CongestionControl,
  TUICUDPRelayMode,
} from '@/api/node';

// ============================================================================
// Types
// ============================================================================

export interface SelectOption<T = string> {
  value: T;
  label: string;
  recommended?: boolean;
}

// ============================================================================
// Shadowsocks Encryption Methods
// ============================================================================

/** Shadowsocks encryption methods (string array for simple iteration) */
export const SS_ENCRYPTION_METHODS = [
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'aes-128-gcm',
  'xchacha20-ietf-poly1305',
  '2022-blake3-aes-128-gcm',
  '2022-blake3-aes-256-gcm',
  '2022-blake3-chacha20-poly1305',
] as const;

/** Shadowsocks encryption methods with labels and recommended flag */
export const SS_ENCRYPTION_OPTIONS: SelectOption[] = [
  { value: 'aes-256-gcm', label: 'aes-256-gcm', recommended: true },
  { value: 'chacha20-ietf-poly1305', label: 'chacha20-ietf-poly1305', recommended: true },
  { value: 'aes-128-gcm', label: 'aes-128-gcm' },
  { value: 'xchacha20-ietf-poly1305', label: 'xchacha20-ietf-poly1305' },
  { value: '2022-blake3-aes-128-gcm', label: '2022-blake3-aes-128-gcm' },
  { value: '2022-blake3-aes-256-gcm', label: '2022-blake3-aes-256-gcm' },
  { value: '2022-blake3-chacha20-poly1305', label: '2022-blake3-chacha20-poly1305' },
];

export type SSEncryptionMethod = (typeof SS_ENCRYPTION_METHODS)[number];

// ============================================================================
// Transport Protocols
// ============================================================================

/** Base transport protocols (Trojan) */
export const TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc'];

/** VLESS transport protocols (includes h2) */
export const VLESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'h2'];

/** VMess transport protocols (includes http, quic) */
export const VMESS_TRANSPORT_PROTOCOLS: TransportProtocol[] = ['tcp', 'ws', 'grpc', 'http', 'quic'];

/** Transport protocol options with labels */
export const TRANSPORT_PROTOCOL_OPTIONS: SelectOption<TransportProtocol>[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'ws', label: 'WebSocket' },
  { value: 'grpc', label: 'gRPC' },
];

/** VLESS transport protocol options with labels */
export const VLESS_TRANSPORT_OPTIONS: SelectOption<TransportProtocol>[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'ws', label: 'WebSocket' },
  { value: 'grpc', label: 'gRPC' },
  { value: 'h2', label: 'HTTP/2' },
];

/** VMess transport protocol options with labels */
export const VMESS_TRANSPORT_OPTIONS: SelectOption<TransportProtocol>[] = [
  { value: 'tcp', label: 'TCP' },
  { value: 'ws', label: 'WebSocket' },
  { value: 'grpc', label: 'gRPC' },
  { value: 'http', label: 'HTTP' },
  { value: 'quic', label: 'QUIC' },
];

// ============================================================================
// VLESS Security
// ============================================================================

/** VLESS security types */
export const VLESS_SECURITY_TYPES: VLESSSecurity[] = ['tls', 'reality', 'none'];

/** VLESS security options with labels */
export const VLESS_SECURITY_OPTIONS: SelectOption<VLESSSecurity>[] = [
  { value: 'tls', label: 'TLS' },
  { value: 'reality', label: 'Reality' },
  { value: 'none', label: 'None' },
];

// ============================================================================
// VMess Security
// ============================================================================

/** VMess security types */
export const VMESS_SECURITY_TYPES: VMessSecurity[] = ['auto', 'aes-128-gcm', 'chacha20-poly1305', 'none', 'zero'];

/** VMess security options with labels */
export const VMESS_SECURITY_OPTIONS: SelectOption<VMessSecurity>[] = [
  { value: 'auto', label: 'Auto', recommended: true },
  { value: 'aes-128-gcm', label: 'AES-128-GCM' },
  { value: 'chacha20-poly1305', label: 'ChaCha20-Poly1305' },
  { value: 'none', label: 'None' },
  { value: 'zero', label: 'Zero' },
];

// ============================================================================
// Congestion Control (Hysteria2/TUIC)
// ============================================================================

/** Congestion control algorithms */
export const CONGESTION_CONTROL_TYPES: CongestionControl[] = ['bbr', 'cubic', 'new_reno'];

/** Congestion control options with labels */
export const CONGESTION_CONTROL_OPTIONS: SelectOption<CongestionControl>[] = [
  { value: 'bbr', label: 'BBR', recommended: true },
  { value: 'cubic', label: 'Cubic' },
  { value: 'new_reno', label: 'New Reno' },
];

// ============================================================================
// TUIC UDP Relay Mode
// ============================================================================

/** TUIC UDP relay modes */
export const TUIC_UDP_RELAY_MODES: TUICUDPRelayMode[] = ['native', 'quic'];

/** TUIC UDP relay mode options with labels */
export const TUIC_UDP_RELAY_OPTIONS: SelectOption<TUICUDPRelayMode>[] = [
  { value: 'native', label: 'Native' },
  { value: 'quic', label: 'QUIC' },
];

// ============================================================================
// TLS Fingerprint
// ============================================================================

/** TLS fingerprint options */
export const TLS_FINGERPRINT_TYPES = ['chrome', 'firefox', 'safari', 'edge', 'random'] as const;

/** TLS fingerprint options with labels */
export const TLS_FINGERPRINT_OPTIONS: SelectOption[] = [
  { value: 'chrome', label: 'Chrome' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'safari', label: 'Safari' },
  { value: 'edge', label: 'Edge' },
  { value: 'random', label: 'Random' },
];

export type TLSFingerprint = (typeof TLS_FINGERPRINT_TYPES)[number];
