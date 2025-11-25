'use client';

import { Sidebar } from '@/features/dashboard/sidebar';
import { Navbar } from '@/features/dashboard/navbar';
import { StatsCards } from '@/features/dashboard/stats-cards';
import { QuickActions } from '@/features/dashboard/quick-actions';
import { TaskList } from '@/features/dashboard/task-list';
import { WeeklyGraph } from '@/features/dashboard/weekly-graph';
import { AISuggest } from '@/features/dashboard/ai-suggest';

import { useAuth } from '@/features/auth/presentation/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Hidden on mobile, visible on medium screens and up */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
                </h1>
                <p className="text-muted-foreground">
                  Here's what's happening with your tasks today.
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <StatsCards />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
              {/* Main Content Area */}
              <div className="space-y-6 lg:col-span-5">
                {/* Quick Actions */}
                <QuickActions />

                {/* Task List */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Recent Tasks</h2>
                    <TaskList />
                  </div>
                </div>
              </div>

              {/* Right Sidebar Area */}
              <div className="space-y-6 lg:col-span-2">
                {/* AI Suggest */}
                <AISuggest />

                {/* Weekly Graph */}
                <WeeklyGraph />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
