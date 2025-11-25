'use client';

import React from 'react'
import { Card } from '@/shared/components/ui/card'

export function ProfileRightSidebar() {
    return (
        <aside className="w-72 bg-sidebar border-l border-sidebar-border p-6 overflow-y-auto">
            {/* Profile Stats */}
            <div className="mb-8">
                <h3 className="text-sm font-semibold text-sidebar-foreground mb-4">Profile Stats</h3>
                <Card className="p-4 bg-card">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-muted rounded-lg p-3">
                                <p className="text-xs text-muted-foreground mb-1">Followers</p>
                                <p className="text-2xl font-bold text-foreground">0</p>
                            </div>
                            <div className="bg-muted rounded-lg p-3">
                                <p className="text-xs text-muted-foreground mb-1">Following</p>
                                <p className="text-2xl font-bold text-primary">0</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Activity */}
            <div>
                <h3 className="text-sm font-semibold text-sidebar-foreground mb-4">Activity</h3>
                <Card className="p-4 bg-card">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Profile Views</span>
                            <span className="text-sm font-semibold text-foreground">0</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">This Week</span>
                            <span className="text-sm font-semibold text-accent">0</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Member Since</span>
                            <span className="text-sm font-semibold text-primary">Today</span>
                        </div>
                    </div>
                </Card>
            </div>
        </aside>
    )
}
