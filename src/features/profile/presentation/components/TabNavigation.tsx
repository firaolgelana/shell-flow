import React from 'react';
import { ProfileTab } from '../types';

interface TabNavigationProps {
    activeTab: ProfileTab;
    onTabChange: (tab: ProfileTab) => void;
}

const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'daily-shells', label: 'Daily Shells' },
    { id: 'weekly-shells', label: 'Weekly Shells' },
    { id: 'followers', label: 'Followers' },
    { id: 'following', label: 'Following' },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="bg-background border-b border-border px-4 sticky top-0 z-10">
            <div className="flex gap-8 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`py-4 px-2 font-medium text-sm border-b-2 transition whitespace-nowrap ${activeTab === tab.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
