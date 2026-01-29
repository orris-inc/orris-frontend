/**
 * Announcements Feature
 * Export all announcement-related functionality
 */

// Components
export * from './components';

// Hooks
export {
  useAnnouncements,
  useAnnouncement,
  useAnnouncementsPage,
} from './hooks/useAnnouncements';

// Types (renamed to avoid conflict with AnnouncementFilters component)
export type { AnnouncementFilters as AnnouncementFiltersState } from './hooks/useAnnouncements';
