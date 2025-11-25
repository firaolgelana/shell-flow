'use client';

import React from 'react'

export function ProfileMainContent() {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
                    <p className="text-muted-foreground">{formattedDate}</p>
                </div>

                {/* Profile content will go here */}
                <div>
                    <p className="text-muted-foreground">Profile information and settings will be displayed here.</p>
                </div>
            </div>
        </main>
    )
}
