# Implementation Plan: Customizable Roles & Competencies

## Executive Summary
This plan outlines the implementation for making roles and competencies customizable in the CMMS application. The current implementation has 4 hardcoded roles and 20 hardcoded competencies. This enhancement will allow administrators to create, edit, and delete custom roles and competencies while maintaining data integrity across the application.

## Current Architecture Analysis

### Roles
- **Definition Location**: `/workspaces/default/code/src/app/components/RoleManagement.tsx` (lines 11-16) - `mockRoles` array
- **Alternate Definition**: `/workspaces/default/code/src/app/components/AddUserDialog.tsx` (lines 17-22) - `availableRoles` array
- **Interface**: `Role { id: number, name: string, description: string }`
- **Usage**: 
  - RoleManagement component displays role buttons and permission matrix
  - UsersRoles component manages user-role assignments
  - Users can have multiple roles (User.roles: number[])
  - No current CRUD operations for roles themselves

### Competencies
- **Definition Location**: `/workspaces/default/code/src/app/App.tsx` (lines 19-40) - `availableCompetencies` array
- **Interface**: `{ id: number, name: string }`
- **Extended Interface**: `UserCompetence { competence_id, competence_name, level: 1-10, source: string }`
- **Usage**:
  - AddCompetenceDialog displays competencies in a dropdown
  - WorkerDetail displays competency radar chart and list
  - Workers assigned competencies with proficiency level (1-10) and source (Certification, Peer Review, etc.)
  - Create and Delete work, Update shows toast but not implemented

### State Management Pattern
- **Current Approach**: Local state in App.tsx
- **Pattern**: Props drilling from App.tsx to child components
- **State Structure**:
  - `users`: User[] - managed in App.tsx
  - `workers`: Worker[] - derived from users
  - `workerCompetencies`: Record<number, UserCompetence[]> - indexed by worker ID
  - No dedicated context or global state management library

## Design Decisions

### 1. UI/UX Approach

#### Roles Management UI
**Location**: Add a third tab in the UsersRoles component

**Rationale**: 
- Users & Roles are conceptually related - users are assigned roles, and roles define what users can do
- The UsersRoles component already has a tabbed interface (Users Directory, Role Management)
- Adding a third tab "Manage Roles" keeps all role-related functionality in one place
- Maintains consistency with existing navigation patterns

**Tab Structure**:
```
Users & Roles
├── Users Directory (existing)
├── Role Permissions (rename from "Role Management")
└── Manage Roles (new)
```

#### Competencies Management UI
**Location**: Add a new sidebar item in "System Administration" section

**Rationale**:
- Competencies are organization-wide reference data, not specific to individual workers
- System Administration is the appropriate section for managing master data
- Separates competency definition (admin task) from competency assignment (operational task in Craft Competency module)
- Follows similar pattern to how Users & Roles is in System Administration

**New Sidebar Item**:
```
System Administration
├── Users & Roles (existing)
├── Manage Competencies (new)
└── Settings (existing, disabled)
```

### 2. Component Structure

#### New Components to Create

**1. ManageRolesTab.tsx**
- **Location**: `/workspaces/default/code/src/app/components/ManageRolesTab.tsx`
- **Purpose**: CRUD interface for role management
- **Features**:
  - Table listing all roles with name, description, user count
  - "Add Role" button
  - Edit/Delete actions per role
  - Search/filter functionality
  - Summary cards (Total Roles, Roles in Use, Unused Roles)
- **Similar To**: UsersDirectory.tsx pattern

**2. AddEditRoleDialog.tsx**
- **Location**: `/workspaces/default/code/src/app/components/AddEditRoleDialog.tsx`
- **Purpose**: Dialog for creating/editing roles
- **Fields**:
  - Role Name (required, text input, max 50 chars)
  - Description (optional, textarea, max 200 chars)
- **Validation**:
  - Name must be unique
  - Name cannot be empty
  - Name must not contain special characters except spaces and hyphens
- **Similar To**: AddUserDialog.tsx pattern

**3. ManageCompetencies.tsx**
- **Location**: `/workspaces/default/code/src/app/components/ManageCompetencies.tsx`
- **Purpose**: Full page component for competency management
- **Features**:
  - Table listing all competencies with name, worker count
  - "Add Competency" button
  - Edit/Delete actions per competency
  - Search/filter functionality
  - Summary cards (Total Competencies, Competencies in Use, Unused Competencies)
  - Visual indicator of competencies assigned to workers
- **Similar To**: UsersDirectory.tsx pattern but as standalone page

**4. AddEditCompetencyDialog.tsx**
- **Location**: `/workspaces/default/code/src/app/components/AddEditCompetencyDialog.tsx`
- **Purpose**: Dialog for creating/editing competencies
- **Fields**:
  - Competency Name (required, text input, max 100 chars)
  - Category (optional, dropdown: Technical, Safety, Management, Operational)
  - Description (optional, textarea, max 200 chars)
- **Validation**:
  - Name must be unique
  - Name cannot be empty
- **Similar To**: AddCompetenceDialog.tsx pattern

### 3. State Management Strategy

#### Approach: Lift state to App.tsx with helper functions

**Rationale**:
- Maintains consistency with current architecture
- Avoids introducing new dependencies (Context API, Redux)
- Simple and straightforward for this use case
- All state already flows through App.tsx

#### State Structure Enhancement

**Add to App.tsx**:
```typescript
// New state variables
const [roles, setRoles] = useState<Role[]>(initialRoles);
const [competencies, setCompetencies] = useState<Competence[]>(initialCompetencies);
```

**Interface Definitions** (add to separate types file):
```typescript
// /workspaces/default/code/src/app/types/index.ts (new file)

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface Competence {
  id: number;
  name: string;
  category?: string;
  description?: string;
}
```

#### Data Flow
1. **Roles**: App.tsx → UsersRoles → ManageRolesTab
2. **Competencies**: App.tsx → ManageCompetencies
3. **Updates**: Child components call handler functions passed as props
4. **Sync**: When roles/competencies change, cascade updates to dependent data

### 4. CRUD Operations Implementation

#### Role CRUD

**Create Role**:
```typescript
const handleAddRole = (newRole: Omit<Role, 'id'>) => {
  const role: Role = {
    ...newRole,
    id: Math.max(...roles.map(r => r.id), 0) + 1
  };
  setRoles(prev => [...prev, role]);
  // Update permissions matrix to include new role (all permissions false by default)
  toast.success(`Role "${role.name}" has been created`);
};
```

**Update Role**:
```typescript
const handleUpdateRole = (roleId: number, updates: Partial<Role>) => {
  setRoles(prev => prev.map(r => 
    r.id === roleId ? { ...r, ...updates } : r
  ));
  // Update permission matrix role references
  // Update user role_names array if role name changed
  toast.success("Role has been updated");
};
```

**Delete Role**:
```typescript
const handleDeleteRole = (roleId: number) => {
  // Check if role is assigned to any users
  const usersWithRole = users.filter(u => u.roles.includes(roleId));
  
  if (usersWithRole.length > 0) {
    // Show confirmation dialog with impact
    // Option 1: Prevent deletion
    // Option 2: Allow deletion and remove role from all users
    toast.error(`Cannot delete role. ${usersWithRole.length} user(s) are assigned this role.`);
    return;
  }
  
  setRoles(prev => prev.filter(r => r.id !== roleId));
  // Remove permissions for this role
  toast.success("Role has been deleted");
};
```

#### Competency CRUD

**Create Competency**:
```typescript
const handleAddCompetency = (newComp: Omit<Competence, 'id'>) => {
  const competency: Competence = {
    ...newComp,
    id: Math.max(...competencies.map(c => c.id), 0) + 1
  };
  setCompetencies(prev => [...prev, competency]);
  toast.success(`Competency "${competency.name}" has been created`);
};
```

**Update Competency**:
```typescript
const handleUpdateCompetency = (compId: number, updates: Partial<Competence>) => {
  setCompetencies(prev => prev.map(c => 
    c.id === compId ? { ...c, ...updates } : c
  ));
  // Update competence_name in all workerCompetencies records
  if (updates.name) {
    setWorkerCompetencies(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(workerId => {
        updated[workerId] = updated[workerId].map(wc =>
          wc.competence_id === compId 
            ? { ...wc, competence_name: updates.name! }
            : wc
        );
      });
      return updated;
    });
  }
  toast.success("Competency has been updated");
};
```

**Delete Competency**:
```typescript
const handleDeleteCompetency = (compId: number) => {
  // Check if competency is assigned to any workers
  const workersWithComp = Object.values(workerCompetencies)
    .flat()
    .filter(wc => wc.competence_id === compId);
  
  if (workersWithComp.length > 0) {
    // Show confirmation dialog with impact
    // Count unique workers
    const workerCount = new Set(
      Object.entries(workerCompetencies)
        .filter(([_, comps]) => comps.some(c => c.competence_id === compId))
        .map(([workerId]) => workerId)
    ).size;
    
    toast.error(`Cannot delete competency. ${workerCount} worker(s) have this competency assigned.`);
    return;
  }
  
  setCompetencies(prev => prev.filter(c => c.id !== compId));
  toast.success("Competency has been deleted");
};
```

### 5. Data Validation Rules

#### Role Validation
1. **Name Validation**:
   - Required field
   - Minimum 2 characters, maximum 50 characters
   - Must be unique (case-insensitive)
   - Only alphanumeric, spaces, and hyphens allowed
   - Cannot start or end with space
   
2. **Description Validation**:
   - Optional field
   - Maximum 200 characters

3. **System Roles Protection**:
   - Consider marking default roles as "system roles" that cannot be deleted
   - Allow editing of description but prevent name changes for system roles
   - Add `is_system: boolean` flag to Role interface

#### Competency Validation
1. **Name Validation**:
   - Required field
   - Minimum 2 characters, maximum 100 characters
   - Must be unique (case-insensitive)
   - No restriction on characters (allows technical terms like "C++", "PLC-5")
   - Trim whitespace

2. **Category Validation**:
   - Optional field
   - If provided, must be one of: Technical, Safety, Management, Operational

3. **Description Validation**:
   - Optional field
   - Maximum 200 characters

### 6. User Experience - Preventing Breaking Changes

#### Strategy: Soft Delete with Dependency Checking

**Role Deletion Protection**:
1. **Check Dependencies**: Before deleting, scan users array for role assignments
2. **Show Impact Dialog**: 
   ```
   Warning: Cannot Delete Role
   
   The role "Technician" is currently assigned to 12 users.
   
   Options:
   - Cancel deletion
   - View users with this role
   - (Future) Reassign users to another role before deleting
   ```
3. **Prevent Deletion**: Do not allow deletion if role is in use
4. **Alternative**: Implement a "deactivate" feature instead of hard delete

**Competency Deletion Protection**:
1. **Check Dependencies**: Scan workerCompetencies for assignments
2. **Show Impact Dialog**:
   ```
   Warning: Cannot Delete Competency
   
   The competency "TIG Welding" is assigned to 5 workers.
   
   Deleting this competency will remove it from all worker profiles.
   This action cannot be undone.
   
   Actions:
   - Cancel deletion
   - View workers with this competency
   - Force delete and remove from all workers (requires confirmation)
   ```
3. **Options**:
   - Prevent deletion (conservative approach)
   - Allow force delete with cascade removal (aggressive approach)
   - **Recommended**: Prevent deletion, require manual removal from workers first

**Edit Protection**:
1. **Role Name Changes**: 
   - Update all user.role_names arrays automatically
   - Show confirmation: "This will update the role name for 12 users"
   
2. **Competency Name Changes**:
   - Update all workerCompetencies.competence_name automatically
   - Show confirmation: "This will update the competency name for 5 workers"

#### Confirmation Dialogs

**Create Component**: ConfirmationDialog.tsx
```typescript
interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  impact?: string; // e.g., "This affects 12 users"
  confirmText?: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}
```

### 7. Integration Points

#### Integration with Existing Components

**1. RoleManagement.tsx**
- **Current**: Uses hardcoded `mockRoles`
- **Change**: Accept `roles` prop from parent
- **Props**: `roles: Role[]`
- **Impact**: Role selector buttons become dynamic

**2. AddUserDialog.tsx**
- **Current**: Uses hardcoded `availableRoles`
- **Change**: Accept `roles` prop from parent
- **Props**: `roles: Role[]`
- **Impact**: Role checkboxes become dynamic

**3. AddCompetenceDialog.tsx**
- **Current**: Uses `availableCompetencies` prop (already dynamic)
- **Change**: None - already receives competencies as prop
- **Impact**: None

**4. UsersRoles.tsx**
- **Current**: Two-tab interface
- **Change**: Add third tab "Manage Roles"
- **New Props**: 
  ```typescript
  roles: Role[];
  onRolesChange: (roles: Role[]) => void;
  users: User[]; // already has
  onUsersChange: (users: User[]) => void; // already has
  ```

**5. App.tsx**
- **Changes**:
  1. Add `roles` and `competencies` state
  2. Add handler functions for CRUD operations
  3. Pass roles to UsersRoles component
  4. Pass competencies to ManageCompetencies page
  5. Add route/page logic for ManageCompetencies
  6. Update navigation in AppSidebar

**6. AppSidebar.tsx**
- **Current**: 4 menu items
- **Change**: Add "Manage Competencies" under System Administration
- **Props**: No change to interface

#### Data Synchronization

**When Role Changes**:
```typescript
// Update permissions matrix
const syncPermissionsOnRoleChange = (roleId: number, newName: string) => {
  setPermissions(prev => prev.map(p =>
    p.role_id === roleId ? { ...p } : p
    // Permission object doesn't store role name, just ID, so no change needed
  ));
};

// Update user role_names
const syncUsersOnRoleChange = (roleId: number, newName: string) => {
  setUsers(prev => prev.map(user => {
    if (user.roles.includes(roleId)) {
      const newRoleNames = user.role_names.map((rName, idx) =>
        user.roles[idx] === roleId ? newName : rName
      );
      return { ...user, role_names: newRoleNames };
    }
    return user;
  }));
};
```

**When Competency Changes**:
```typescript
// Update worker competency records
const syncWorkerCompetenciesOnChange = (compId: number, newName: string) => {
  setWorkerCompetencies(prev => {
    const updated = { ...prev };
    Object.keys(updated).forEach(workerId => {
      updated[workerId] = updated[workerId].map(wc =>
        wc.competence_id === compId
          ? { ...wc, competence_name: newName }
          : wc
      );
    });
    return updated;
  });
};
```

## Implementation Sequence

### Phase 1: Foundation & Types (1-2 hours)
1. Create types file: `/workspaces/default/code/src/app/types/index.ts`
2. Move interface definitions (Role, Competence, etc.)
3. Update imports across components
4. Add `is_system` flag to default roles

### Phase 2: Role Management (3-4 hours)
1. Create `ManageRolesTab.tsx` component
   - Table with role listing
   - Summary cards
   - Search functionality
2. Create `AddEditRoleDialog.tsx` component
   - Form with validation
   - Edit mode support
3. Create `ConfirmationDialog.tsx` component (reusable)
4. Update `UsersRoles.tsx` to add third tab
5. Add role CRUD handlers to `App.tsx`
6. Update `RoleManagement.tsx` to use dynamic roles
7. Update `AddUserDialog.tsx` to use dynamic roles
8. Test role creation, editing, deletion with validation

### Phase 3: Competency Management (3-4 hours)
1. Create `ManageCompetencies.tsx` component
   - Table with competency listing
   - Summary cards
   - Search functionality
2. Create `AddEditCompetencyDialog.tsx` component
   - Form with validation
   - Category dropdown
   - Edit mode support
3. Add competency CRUD handlers to `App.tsx`
4. Update `AppSidebar.tsx` to add "Manage Competencies" menu item
5. Add routing logic in `App.tsx` for new page
6. Test competency creation, editing, deletion with validation

### Phase 4: Data Synchronization (2-3 hours)
1. Implement sync functions in `App.tsx`:
   - syncUsersOnRoleChange
   - syncWorkerCompetenciesOnChange
2. Integrate sync functions into update handlers
3. Test cascading updates
4. Verify data integrity across components

### Phase 5: Dependency Checking & Protection (2-3 hours)
1. Implement dependency checking for role deletion
2. Implement dependency checking for competency deletion
3. Create impact analysis dialogs
4. Add "View affected users/workers" functionality
5. Test protection mechanisms

### Phase 6: Polish & Error Handling (1-2 hours)
1. Add loading states
2. Add error boundaries
3. Improve toast messages
4. Add help text / tooltips
5. Accessibility improvements (ARIA labels, keyboard navigation)
6. Responsive design checks

### Phase 7: Testing & Documentation (2-3 hours)
1. Test all CRUD operations
2. Test edge cases (empty states, special characters, duplicates)
3. Test data synchronization
4. Test dependency protection
5. Cross-browser testing
6. Document new components in code comments
7. Update README if exists

## Technical Considerations

### Performance
- **Role/Competency Lists**: Current scale (4 roles, 20 competencies) - no performance concerns
- **Scaling**: If lists grow beyond 100 items, consider:
  - Virtualized lists (react-window)
  - Pagination for tables
  - Backend search/filter instead of client-side
- **Re-renders**: Memoize expensive computations with useMemo
- **Dependency Checking**: O(n) operations - acceptable for current scale

### Data Persistence
- **Current**: In-memory state (lost on refresh)
- **Future**: 
  - LocalStorage for temporary persistence
  - Backend API integration for permanent storage
  - Consider using SWR or React Query for server state management

### Error Handling
- **Validation Errors**: Show inline in forms
- **Duplicate Names**: Check before save, show specific error
- **Network Errors** (future): Retry logic, offline support
- **State Corruption**: Add validation before state updates

### Accessibility
- **Keyboard Navigation**: All dialogs and tables must be keyboard accessible
- **Screen Readers**: Proper ARIA labels, roles, and live regions
- **Focus Management**: Trap focus in dialogs, return focus on close
- **Color Contrast**: Ensure badges and status indicators meet WCAG AA standards

### Browser Compatibility
- **Target**: Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- **Features Used**: ES6+, React 18, Dialog API (polyfilled by Radix UI)
- **Testing**: Test in all target browsers

## Alternative Approaches Considered

### 1. Context API for State Management
**Pros**: 
- Reduces prop drilling
- More scalable for complex state
- Better separation of concerns

**Cons**: 
- Adds complexity
- Overkill for current scale
- More refactoring required

**Decision**: Not selected - current prop drilling is manageable

### 2. Separate Page for Role Management
**Pros**:
- More space for complex UI
- Clearer separation from user management

**Cons**:
- Fragments related functionality
- Extra navigation step
- Less discoverable

**Decision**: Not selected - keeping roles with users maintains conceptual cohesion

### 3. Allow Force Delete with Cascade
**Pros**:
- More flexible for admins
- Faster cleanup of obsolete data

**Cons**:
- Risk of unintended data loss
- No undo functionality
- Could break worker profiles

**Decision**: Not selected - prevent deletion is safer, require manual cleanup

### 4. Soft Delete (Archive)
**Pros**:
- Preserves historical data
- Reversible action
- Maintains data integrity

**Cons**:
- Adds complexity (archived vs active)
- UI needs to handle archived items
- More state to manage

**Decision**: Consider for future enhancement

## Risk Assessment

### High Risk
1. **Data Loss on Cascade Delete**: Mitigated by preventing deletion of in-use items
2. **State Desync**: Mitigated by centralized handlers and sync functions

### Medium Risk
1. **Performance with Large Lists**: Mitigated by planning for virtualization
2. **Validation Edge Cases**: Mitigated by comprehensive validation logic

### Low Risk
1. **UI/UX Confusion**: Mitigated by clear labeling and help text
2. **Browser Compatibility**: Mitigated by using polyfilled components

## Success Criteria

1. **Functional**:
   - Admins can create custom roles and competencies
   - Admins can edit existing roles and competencies
   - Admins can delete unused roles and competencies
   - System prevents deletion of in-use items
   - Data remains synchronized across all components

2. **Non-Functional**:
   - All forms validate input correctly
   - All actions provide clear feedback (toasts, errors)
   - UI is responsive and accessible
   - No console errors or warnings
   - Performance remains smooth (< 100ms interaction latency)

3. **User Experience**:
   - Intuitive navigation to management interfaces
   - Clear confirmation for destructive actions
   - Helpful error messages guide users to resolution
   - Consistent with existing UI patterns

## Future Enhancements

1. **Backend Integration**: Connect to API for persistence
2. **Soft Delete**: Archive instead of hard delete
3. **Role Hierarchy**: Parent-child relationships between roles
4. **Competency Categories**: Group competencies by type
5. **Bulk Operations**: Import/export roles and competencies
6. **Audit Trail**: Track who created/modified/deleted items
7. **Advanced Permissions**: Role-based access to role/competency management
8. **Competency Levels**: Define standard proficiency levels per competency
9. **Role Templates**: Predefined role templates for common scenarios
10. **Search & Filter**: Advanced filtering by category, usage, etc.
