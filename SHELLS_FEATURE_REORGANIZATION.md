# Code Reorganization: Shells Feature

## Overview
Successfully reorganized the codebase to separate task-related functionality into a dedicated `shells` feature, keeping the `profile` feature focused on user profile management.

## Changes Made

### 1. New Feature Structure: `shells`

Created a new feature directory with clean architecture layers:

```
src/features/shells/
├── domain/
│   ├── Task.ts
│   └── TaskRepository.ts
├── application/
│   ├── CreateTaskUseCase.ts
│   └── GetRecentTasksUseCase.ts
├── infrastructure/
│   └── FirebaseTaskRepository.ts
└── presentation/
    ├── components/
    │   └── CreateTaskDialog.tsx
    └── hooks/
        ├── useCreateTask.ts
        └── useRecentTasks.ts
```

### 2. Files Moved from `profile` to `shells`

**Domain Layer:**
- `Task.ts` - Task entity definition
- `TaskRepository.ts` - Task repository interface

**Infrastructure Layer:**
- `FirebaseTaskRepository.ts` - Firestore implementation

**Application Layer:**
- `CreateTaskUseCase.ts` - Task creation logic

**Presentation Layer:**
- `CreateTaskDialog.tsx` - Task creation UI
- `useCreateTask.ts` - Task creation hook

### 3. New Features Added

**Application Layer:**
- `GetRecentTasksUseCase.ts` - Retrieves recent tasks with validation

**Infrastructure Layer:**
- Added `getRecentTasks()` method to `FirebaseTaskRepository`
  - Orders tasks by `createdAt` descending
  - Supports configurable limit (default: 5, max: 100)
  - Uses Firestore `orderBy` and `limit` queries

**Presentation Layer:**
- `useRecentTasks.ts` - Hook for fetching recent tasks with loading/error states

### 4. Updated Components

**Dashboard TaskList (`src/features/dashboard/task-list.tsx`):**
- ✅ Replaced mock data with real Firestore data
- ✅ Integrated `useRecentTasks` hook
- ✅ Added loading state
- ✅ Added error handling
- ✅ Added empty state with helpful message
- ✅ Added search functionality
- ✅ Simplified table columns (Task, Date, Time, Duration)
- ✅ Removed mock priority/category fields

**QuickActions (`src/features/dashboard/quick-actions.tsx`):**
- ✅ Updated import path to `@/features/shells/presentation/components/CreateTaskDialog`
- ✅ Added dark mode support for Auto-Schedule button

### 5. Import Path Updates

All files updated to reference the new `shells` feature:

```typescript
// Before
import { Task } from '@/features/profile/domain/Task';
import { CreateTaskDialog } from '@/features/profile/presentation/components/CreateTaskDialog';

// After
import { Task } from '@/features/shells/domain/Task';
import { CreateTaskDialog } from '@/features/shells/presentation/components/CreateTaskDialog';
```

### 6. Profile Feature Scope

The `profile` feature now focuses exclusively on:
- User profile information (username, bio, avatar)
- Profile display and editing
- User-specific settings
- Social features (followers, following)

Task management is completely handled by the `shells` feature.

## Data Flow

### Creating a Task
```
User clicks "Add New Task"
    ↓
CreateTaskDialog (shells/presentation)
    ↓
useCreateTask hook (shells/presentation)
    ↓
CreateTaskUseCase (shells/application)
    ↓
FirebaseTaskRepository (shells/infrastructure)
    ↓
Firestore `tasks` collection
```

### Displaying Recent Tasks
```
Dashboard loads
    ↓
TaskList component (dashboard)
    ↓
useRecentTasks hook (shells/presentation)
    ↓
GetRecentTasksUseCase (shells/application)
    ↓
FirebaseTaskRepository.getRecentTasks() (shells/infrastructure)
    ↓
Firestore query (orderBy createdAt desc, limit 5)
    ↓
Tasks displayed in table
```

## Firestore Queries

### Get Recent Tasks
```typescript
const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(5)
);
```

**Note:** Requires Firestore composite index on `userId` and `createdAt`.

## Benefits of This Organization

1. **Clear Separation of Concerns**
   - `shells` = Task/Shell management
   - `profile` = User profile management

2. **Better Scalability**
   - Easy to add more shell-related features
   - Profile features don't clutter task logic

3. **Improved Maintainability**
   - Related code is grouped together
   - Easier to find and modify task-related code

4. **Clean Architecture Compliance**
   - Each feature follows the same layered structure
   - Dependencies flow inward (presentation → application → domain)

## Testing the Changes

1. **Navigate to Dashboard**
2. **Verify "Recent Tasks" section:**
   - Shows "No tasks yet" if no tasks exist
   - Shows loading state while fetching
   - Shows error if fetch fails
3. **Create a new task:**
   - Click "Add New Task"
   - Fill in the form
   - Submit
4. **Verify task appears in Recent Tasks:**
   - Should show immediately after creation
   - Should display: title, description, date, time, duration
5. **Test search:**
   - Type in search box
   - Tasks should filter by title/description

## Next Steps (Optional)

- [ ] Add task refresh button
- [ ] Add task editing functionality
- [ ] Add task deletion
- [ ] Add task completion toggle
- [ ] Create dedicated Shells page
- [ ] Add pagination for tasks
- [ ] Add task categories/tags
- [ ] Add task priority levels

## Files Summary

### Created (2 files)
1. `src/features/shells/application/GetRecentTasksUseCase.ts`
2. `src/features/shells/presentation/hooks/useRecentTasks.ts`

### Moved (7 files)
1. `src/features/shells/domain/Task.ts`
2. `src/features/shells/domain/TaskRepository.ts`
3. `src/features/shells/infrastructure/FirebaseTaskRepository.ts`
4. `src/features/shells/application/CreateTaskUseCase.ts`
5. `src/features/shells/presentation/components/CreateTaskDialog.tsx`
6. `src/features/shells/presentation/hooks/useCreateTask.ts`

### Modified (3 files)
1. `src/features/dashboard/task-list.tsx` - Uses real Firestore data
2. `src/features/dashboard/quick-actions.tsx` - Updated import paths
3. `src/features/shells/infrastructure/FirebaseTaskRepository.ts` - Added getRecentTasks method

**Total: 12 files affected**
