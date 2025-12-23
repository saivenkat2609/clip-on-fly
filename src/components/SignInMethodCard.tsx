/**
 * SignInMethodCard Component
 * Displays a sign-in method (Google or Password) with link/unlink functionality
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Chrome, Lock, CheckCircle2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignInMethodCardProps {
  provider: 'google' | 'password';
  connected: boolean;
  email?: string;
  onLink: () => void;
  onUnlink: () => void;
  loading?: boolean;
}

export function SignInMethodCard({
  provider,
  connected,
  email,
  onLink,
  onUnlink,
  loading = false,
}: SignInMethodCardProps) {
  const providerConfig = {
    google: {
      name: 'Google',
      icon: Chrome,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      description: 'Sign in with your Google account',
    },
    password: {
      name: 'Email & Password',
      icon: Lock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950',
      description: 'Sign in with your email and password',
    },
  };

  const config = providerConfig[provider];
  const Icon = config.icon;

  return (
    <Card className={cn(
      'shadow-sm transition-all',
      connected && 'border-green-200 dark:border-green-800'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left side: Icon and info */}
          <div className="flex items-start gap-3 flex-1">
            {/* Icon */}
            <div className={cn(
              'p-2 rounded-lg',
              config.bgColor
            )}>
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{config.name}</h3>
                {connected && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                {config.description}
              </p>
              {connected && email && (
                <p className="text-xs text-muted-foreground font-medium">
                  {email}
                </p>
              )}
            </div>
          </div>

          {/* Right side: Action button */}
          <div className="flex-shrink-0">
            {connected ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onUnlink}
                disabled={loading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <X className="h-4 w-4 mr-1" />
                Unlink
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onLink}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Link
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
