/**
 * Supabase Channel Tracking Utility
 * 
 * This utility helps track and debug active Supabase realtime channels.
 * Useful for identifying connection pool issues and orphaned subscriptions.
 * 
 * Usage:
 *   import { channelTracker } from '@/shared/config/supabaseChannels';
 *   
 *   // Track a channel
 *   const channel = supabase.channel('my-channel');
 *   channelTracker.track('my-channel', channel);
 *   
 *   // Untrack when done
 *   channelTracker.untrack('my-channel');
 *   
 *   // Debug: log all active channels
 *   channelTracker.logActiveChannels();
 */

import { RealtimeChannel } from '@supabase/supabase-js';

interface ChannelInfo {
    channel: RealtimeChannel;
    createdAt: Date;
    component?: string;
}

class SupabaseChannelTracker {
    private channels: Map<string, ChannelInfo> = new Map();
    private enabled: boolean = process.env.NODE_ENV === 'development';

    /**
     * Enable or disable channel tracking
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    /**
     * Track a new channel
     * @param name - Unique identifier for the channel
     * @param channel - The Supabase RealtimeChannel instance
     * @param component - Optional component name for debugging
     */
    track(name: string, channel: RealtimeChannel, component?: string) {
        if (!this.enabled) return;

        if (this.channels.has(name)) {
            console.warn(`[ChannelTracker] Channel "${name}" already exists. This may indicate a subscription leak.`);
        }

        this.channels.set(name, {
            channel,
            createdAt: new Date(),
            component,
        });

        if (this.enabled) {
            console.debug(`[ChannelTracker] Channel "${name}" tracked. Total active: ${this.channels.size}`);
        }
    }

    /**
     * Untrack a channel (call when unsubscribing)
     * @param name - The channel identifier
     */
    untrack(name: string) {
        if (!this.enabled) return;

        const wasTracked = this.channels.delete(name);
        
        if (this.enabled && wasTracked) {
            console.debug(`[ChannelTracker] Channel "${name}" untracked. Total active: ${this.channels.size}`);
        }
    }

    /**
     * Get the count of active channels
     */
    getActiveCount(): number {
        return this.channels.size;
    }

    /**
     * Get all active channel names
     */
    getActiveChannelNames(): string[] {
        return Array.from(this.channels.keys());
    }

    /**
     * Log all active channels for debugging
     */
    logActiveChannels() {
        if (this.channels.size === 0) {
            console.log('[ChannelTracker] No active channels');
            return;
        }

        console.group(`[ChannelTracker] Active Channels (${this.channels.size})`);
        this.channels.forEach((info, name) => {
            const age = Math.round((Date.now() - info.createdAt.getTime()) / 1000);
            console.log(`  - ${name}${info.component ? ` (${info.component})` : ''} - ${age}s old`);
        });
        console.groupEnd();
    }

    /**
     * Check for potential issues (too many channels, old channels)
     * @param maxChannels - Warning threshold for channel count
     * @param maxAgeSeconds - Warning threshold for channel age
     */
    checkHealth(maxChannels: number = 10, maxAgeSeconds: number = 3600) {
        const issues: string[] = [];

        if (this.channels.size > maxChannels) {
            issues.push(`Too many active channels (${this.channels.size}). Max recommended: ${maxChannels}`);
        }

        const now = Date.now();
        this.channels.forEach((info, name) => {
            const ageSeconds = (now - info.createdAt.getTime()) / 1000;
            if (ageSeconds > maxAgeSeconds) {
                issues.push(`Channel "${name}" is ${Math.round(ageSeconds / 60)} minutes old - possible leak`);
            }
        });

        if (issues.length > 0) {
            console.warn('[ChannelTracker] Health check issues:');
            issues.forEach(issue => console.warn(`  - ${issue}`));
        } else if (this.enabled) {
            console.log('[ChannelTracker] Health check passed');
        }

        return issues;
    }

    /**
     * Clear all tracked channels (useful for cleanup/testing)
     */
    clear() {
        this.channels.clear();
    }
}

// Singleton instance
export const channelTracker = new SupabaseChannelTracker();

// Export type for use in other files
export type { ChannelInfo };

