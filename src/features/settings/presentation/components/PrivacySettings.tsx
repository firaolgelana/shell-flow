'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/features/auth/presentation/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Shield, Eye, Calendar, Users, Settings2 } from 'lucide-react';
import { GetPrivacySettingsUseCase } from '../../application/GetPrivacySettingsUseCase';
import { UpdatePrivacySettingsUseCase } from '../../application/UpdatePrivacySettingsUseCase';
import { privacyRepository } from '../../infrastructure';
import {
    PrivacySettings as PrivacySettingsType,
    VisibilityLevel,
    ProfileSection,
    VISIBILITY_LABELS,
    VISIBILITY_DESCRIPTIONS,
} from '../../domain/PrivacySettings';
import { CustomVisibilityDialog } from './CustomVisibilityDialog';

const VISIBILITY_OPTIONS: VisibilityLevel[] = ['public', 'friends', 'custom', 'private'];

interface SectionConfig {
    key: ProfileSection;
    settingsKey: keyof Pick<PrivacySettingsType, 'profileVisibility' | 'scheduleVisibility' | 'activityVisibility'>;
    label: string;
    description: string;
    icon: React.ReactNode;
}

const SECTIONS: SectionConfig[] = [
    {
        key: 'profile',
        settingsKey: 'profileVisibility',
        label: 'Profile Info',
        description: 'Bio, email, and profile details',
        icon: <Eye className="h-4 w-4" />,
    },
    {
        key: 'schedule',
        settingsKey: 'scheduleVisibility',
        label: 'Schedule',
        description: 'Daily and weekly tasks',
        icon: <Calendar className="h-4 w-4" />,
    },
    {
        key: 'activity',
        settingsKey: 'activityVisibility',
        label: 'Activity',
        description: 'Followers and following lists',
        icon: <Users className="h-4 w-4" />,
    },
];

export function PrivacySettings() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<PrivacySettingsType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [customDialogOpen, setCustomDialogOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<ProfileSection>('profile');

    // Memoize use cases
    const getPrivacySettings = useMemo(() => new GetPrivacySettingsUseCase(privacyRepository), []);
    const updatePrivacySettings = useMemo(() => new UpdatePrivacySettingsUseCase(privacyRepository), []);

    // Fetch settings on mount
    useEffect(() => {
        async function fetchSettings() {
            if (!user?.id) return;

            try {
                setLoading(true);
                const data = await getPrivacySettings.execute(user.id);
                setSettings(data);
            } catch (error) {
                console.error('Failed to load privacy settings:', JSON.stringify(error, null, 2));
            } finally {
                setLoading(false);
            }
        }

        fetchSettings();
    }, [user?.id, getPrivacySettings]);

    const handleVisibilityChange = async (
        section: SectionConfig,
        value: VisibilityLevel
    ) => {
        if (!user?.id || !settings) return;

        setSaving(true);
        try {
            await updatePrivacySettings.execute({
                userId: user.id,
                [section.settingsKey]: value,
            });

            setSettings((prev) => prev ? {
                ...prev,
                [section.settingsKey]: value,
            } : null);
        } catch (error) {
            console.error('Failed to update privacy settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const openCustomDialog = (section: ProfileSection) => {
        setActiveSection(section);
        setCustomDialogOpen(true);
    };

    if (loading || !settings) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Privacy Settings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-muted rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Privacy Settings
                    </CardTitle>
                    <CardDescription>
                        Control who can see different parts of your profile
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {SECTIONS.map((section) => {
                        const currentValue = settings[section.settingsKey];
                        const isCustom = currentValue === 'custom';

                        return (
                            <div key={section.key} className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 text-muted-foreground">
                                            {section.icon}
                                        </div>
                                        <div className="space-y-0.5">
                                            <Label htmlFor={section.key}>{section.label}</Label>
                                            <p className="text-sm text-muted-foreground">
                                                {section.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={currentValue}
                                            onValueChange={(value: VisibilityLevel) =>
                                                handleVisibilityChange(section, value)
                                            }
                                            disabled={saving}
                                        >
                                            <SelectTrigger className="w-[160px]" id={section.key}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {VISIBILITY_OPTIONS.map((option) => (
                                                    <SelectItem key={option} value={option}>
                                                        <div className="flex flex-col">
                                                            <span>{VISIBILITY_LABELS[option]}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {isCustom && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => openCustomDialog(section.key)}
                                                title="Manage custom list"
                                            >
                                                <Settings2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground ml-7">
                                    {VISIBILITY_DESCRIPTIONS[currentValue]}
                                </p>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {user?.id && (
                <CustomVisibilityDialog
                    open={customDialogOpen}
                    onOpenChange={setCustomDialogOpen}
                    section={activeSection}
                    ownerId={user.id}
                />
            )}
        </div>
    );
}

