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
 * Frontend create user form request (includes password field)
 * Note: Backend CreateUserRequest doesn't include password, but frontend form needs it
 */
export interface CreateUserFormData {
  email: string;
  name: string;
  password: string;
}

/**
 * User status enum
 * Updated 2025-12-19: Removed 'deleted' status
 */
export type UserStatus =
  | 'active'      // Active
  | 'inactive'    // Inactive
  | 'pending'     // Pending
  | 'suspended';  // Suspended

/**
 * User role enum
 */
export type UserRole =
  | 'user'        // Regular user
  | 'admin';      // Administrator

/**
 * User filter conditions (frontend use)
 */
export interface UserFilters {
  status?: UserStatus;          // Status filter
  role?: UserRole;              // Role filter
  search?: string;              // Frontend local search (by email/name)
}
