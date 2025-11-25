'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

export function ThemeSettings() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const themes = [
        { value: 'light', label: 'Light', icon: Sun, description: 'Light theme' },
        { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark theme' },
        { value: 'system', label: 'System', icon: Monitor, description: 'Follow system preference' },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5" />
                    Appearance
                </CardTitle>
                <CardDescription>
                    Customize how ShellFlow looks on your device
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label className="text-sm font-medium mb-3 block">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                        {themes.map((themeOption) => {
                            const Icon = themeOption.icon;
                            const isActive = theme === themeOption.value;

                            return (
                                <Button
                                    key={themeOption.value}
                                    variant={isActive ? 'default' : 'outline'}
                                    className={`h-auto flex-col gap-2 p-4 ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''
                                        }`}
                                    onClick={() => setTheme(themeOption.value)}
                                >
                                    <Icon className="h-5 w-5" />
                                    <div className="text-center">
                                        <div className="font-medium">{themeOption.label}</div>
                                        <div className="text-xs opacity-70 mt-1">
                                            {themeOption.description}
                                        </div>
                                    </div>
                                </Button>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                        Current theme: <span className="font-medium text-foreground capitalize">{theme}</span>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
