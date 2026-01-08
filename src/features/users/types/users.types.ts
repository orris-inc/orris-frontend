/**
 * User management type definitions
 * Backend API types imported from @/api/user, only frontend-specific types are kept here
 */

// Re-export types from @/api/user
export type { UserResponse, CreateUserRequest, UpdateUserRequest, ListUsersParams } from '@/api/user';

// Keep User alias for backward compatibility
export type { UserResponse as User } from '@/api/user';

// Keep alias for backward compatibility
export type { UserResponse as UserListItem } from '@/api/user';

/**
 * User account status
 * Matches UpdateUserRequest.status in @/api/user
 */
export type UserStatus =
  | 'active'      // Account is active and usable
  | 'inactive'    // Account is inactive
  | 'pending'     // Account is pending verification
  | 'suspended';  // Account is suspended by admin

/**
 * User role
 * Matches UpdateUserRequest.role in @/api/user
 */
export type UserRole =
  | 'user'        // Regular user
  | 'admin';      // Administrator with full access

/**
 * User filter conditions (frontend use)
 * Used for filtering user list in the UI
 */
export interface UserFilters {
  /** Filter by account status */
  status?: UserStatus;
  /** Filter by user role */
  role?: UserRole;
  /** Frontend local search (by email/name) */
  search?: string;
}
