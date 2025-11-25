import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { User } from '@/features/auth/domain/User'

interface ProfileSidebarProps {
    user: User | null;
    loading: boolean;
}

export function ProfileSidebar({ user, loading }: ProfileSidebarProps) {
    if (loading) {
        return (
            <aside className="w-64 bg-sidebar border-r border-sidebar-border p-6 overflow-y-auto">
                <div className="animate-pulse">
                    <div className="h-16 w-16 bg-gray-300 rounded-full mx-auto mb-3"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2 mx-auto"></div>
                </div>
            </aside>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <aside className="w-64 bg-sidebar border-r border-sidebar-border p-6 overflow-y-auto">
            {/* Profile Section */}
            <Card className="p-5 mb-8 bg-card">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full mb-3 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-lg font-semibold text-card-foreground mb-1">
                        {user.displayName || 'User'}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-5">{user.email}</p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 w-full mb-5">
                        <div className="bg-muted rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Tasks</p>
                            <p className="text-lg font-bold text-primary">0</p>
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Shells</p>
                            <p className="text-lg font-bold text-accent">0</p>
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Followers</p>
                            <p className="text-lg font-bold text-primary">0</p>
                        </div>
                    </div>

                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        Edit Profile
                    </Button>
                </div>
            </Card>

            {/* Navigation */}
            <nav className="space-y-2">
                <NavItem label="Dashboard" icon="📊" href="/dashboard" active />
                <NavItem label="My Shells" icon="🐚" href="/shells" />
                <NavItem label="Templates" icon="📋" href="/templates" />
                <NavItem label="Activity" icon="📈" href="/activity" />
                <NavItem label="Settings" icon="⚙️" href="/settings" />
            </nav>

            {/* Help Section */}
            <Card className="p-4 mt-8 bg-accent/10 border-accent/20">
                <p className="text-sm font-medium text-foreground mb-2">Need Help?</p>
                <p className="text-xs text-muted-foreground mb-3">
                    Check out our docs and tutorials to get started
                </p>
                <Button variant="outline" size="sm" className="w-full text-xs">
                    View Docs
                </Button>
            </Card>
        </aside>
    )
}

function NavItem({
    label,
    icon,
    href,
    active = false,
}: {
    label: string
    icon: string
    href?: string
    active?: boolean
}) {
    const pathname = usePathname();
    const isActive = href ? pathname === href : active;

    const content = (
        <>
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
        </>
    );

    const className = `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        }`;

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return (
        <button className={className}>
            {content}
        </button>
    );
}
