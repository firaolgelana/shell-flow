import React from 'react';
import { Task } from '../types';
import { CATEGORIES } from '../constants';

interface TimelinePreviewProps {
    tasks: Task[];
    max?: number;
}

export const TimelinePreview: React.FC<TimelinePreviewProps> = ({ tasks, max = 3 }) => {
    const displayTasks = tasks.slice(0, max);

    return (
        <div className="space-y-2">
            {displayTasks.map((task, idx) => {
                const category = CATEGORIES[task.category];
                return (
                    <div key={task.id} className="flex items-start gap-3">
                        {/* Timeline node */}
                        <div className="flex flex-col items-center">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: category?.color || '#ccc' }}
                            ></div>
                            {idx < displayTasks.length - 1 && (
                                <div
                                    className="w-0.5 h-6 mt-1"
                                    style={{ backgroundColor: category?.color || '#ccc', opacity: 0.3 }}
                                ></div>
                            )}
                        </div>
                        {/* Task info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.time}</p>
                        </div>
                    </div>
                );
            })}
            {tasks.length > max && (
                <p className="text-xs text-muted-foreground pl-5">+{tasks.length - max} more</p>
            )}
        </div>
    );
};
