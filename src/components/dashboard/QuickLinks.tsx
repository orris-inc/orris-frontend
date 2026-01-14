/**
 * Quick Links Card
 * Provides useful navigation links
 */

import { User, CreditCard, Database, Tag, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cardStyles, getButtonClass, getBadgeClass } from '@/lib/ui-styles';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { cn } from '@/lib/utils';

interface QuickLink {
  icon: React.ReactNode;
  title: string;
  description: string;
  path?: string; // Optional, empty means not yet implemented
  adminOnly?: boolean;
  implemented: boolean; // Whether implemented
}

export const QuickLinks = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const links: QuickLink[] = [
    {
      icon: <User className="size-5" />,
      title: t('nav.profile'),
      description: t('dashboard.quickLinks.profileDesc'),
      path: '/dashboard/profile',
      implemented: true,
    },
    {
      icon: <CreditCard className="size-5" />,
      title: t('nav.subscriptionManagement'),
      description: t('dashboard.quickLinks.subscriptionDesc'),
      implemented: false, // To be implemented
    },
    {
      icon: <Database className="size-5" />,
      title: t('nav.nodeAgent'),
      description: t('dashboard.quickLinks.nodeDesc'),
      path: '/admin/nodes',
      adminOnly: true,
      implemented: true,
    },
    {
      icon: <Tag className="size-5" />,
      title: t('nav.pricing'),
      description: t('dashboard.quickLinks.pricingDesc'),
      path: '/pricing',
      implemented: true,
    },
  ];

  // Filter links based on user permissions
  const visibleLinks = links.filter((link) => !link.adminOnly || isAdmin);

  const handleLinkClick = (link: QuickLink) => {
    if (link.implemented && link.path) {
      navigate(link.path);
    }
  };

  return (
    <div className={cn(cardStyles, 'shadow-sm hover:shadow-md transition-shadow h-full')}>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-5">{t('dashboard.quickLinks.title')}</h3>

        <div className="space-y-3">
          {visibleLinks.map((link, index) => (
            <button
              key={index}
              onClick={() => handleLinkClick(link)}
              disabled={!link.implemented}
              className={cn(
                getButtonClass('outline', 'default', 'h-auto w-full justify-start p-4 text-left transition-all'),
                link.implemented
                  ? 'hover:border-primary hover:bg-accent/50 hover:shadow-sm cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={cn(
                    'flex items-center justify-center size-11 rounded-xl transition-colors',
                    link.implemented
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'font-semibold text-sm',
                        link.implemented ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {link.title}
                    </span>
                    {!link.implemented && (
                      <span className={getBadgeClass('outline', 'h-5 text-xs px-2')}>
                        {t('dashboard.quickLinks.comingSoon')}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs line-clamp-1',
                      link.implemented ? 'text-muted-foreground' : 'text-muted-foreground/60'
                    )}
                  >
                    {link.description}
                  </span>
                </div>
                {link.implemented && <ArrowRight className="size-5 ml-2 text-muted-foreground group-hover:text-primary transition-colors" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
