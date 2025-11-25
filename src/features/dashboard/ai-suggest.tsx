'use client';

import { Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

export function AISuggest() {
    return (
        <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 border-purple-200 dark:border-purple-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700">
                    <Sparkles className="h-4 w-4" />
                    AI Suggest
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Based on your habits, you're most productive in the morning.
                        Consider moving "React Query Deep Dive" to 9:00 AM.
                    </p>
                    <Button variant="outline" size="sm" className="w-full justify-between hover:bg-white/50">
                        Apply Suggestion
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
