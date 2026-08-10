import { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';

/**
 * Navbar user menu: avatar, name and role with a dropdown containing
 * profile and logout actions.
 */
export function AdminUserMenu() {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const [, navigate] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const initials =
    `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() ||
    '?';
  const roleLabel = user.role ? t(`admin.roles.${user.role.slug}`) : '';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 px-2"
          data-testid="button-admin-user-menu"
        >
          <Avatar className="h-8 w-8">
            {user.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt={fullName} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 flex-col items-start text-start sm:flex">
            <span className="max-w-36 truncate text-sm font-medium leading-tight">
              {fullName}
            </span>
            {roleLabel ? (
              <span className="text-xs leading-tight text-muted-foreground">
                {roleLabel}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate">{fullName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => navigate('/profile')}
          data-testid="menu-item-admin-profile"
        >
          <UserRound className="h-4 w-4" aria-hidden="true" />
          {t('admin.userMenu.profile')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isLoggingOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
          data-testid="menu-item-admin-logout"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t('common.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
