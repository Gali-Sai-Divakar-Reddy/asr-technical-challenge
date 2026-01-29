# Architecture Documentation

> **Status:** Planning Phase  
> **Purpose:** Document refactoring approach and architectural decisions  
> **Phase:** Phase 1 - Analyse & Refactor

This document outlines the **planned architectural refactoring** for Phase 1 of the VectorCam interview dashboard. The goal of this phase is to improve **structure, naming consistency, separation of concerns, and correctness**—without introducing new user-facing features, which are intentionally deferred to Phase 2.

---

## Current State Analysis

### Existing File Structure

```
interview/
├── components/
│   ├── RecordCard.tsx           Presentational component
│   ├── RecordFilter.tsx         Controlled component (exists but unused)
│   ├── RecordSummary.tsx        Uses useRecords (exists but unused)
│   ├── HistoryLog.tsx           Uses useRecords (exists but unused)
│   ├── RecordList.tsx           ⚠️ mixed responsibilities
│   └── RecordDetailDialog.tsx   ⚠️  incomplete form
│
├── context/
│   └── RecordsContext.tsx       ⚠️  Mixed concerns (API + state + history)
│
├── hooks/
│   └── useRecords.tsx          Thin wrapper
│
└── types/
    └── index.ts                Type definitions
```

### Current Responsibilities

**RecordsContext.tsx:**
- State management (`data`, `busy`, `err`, `log`)
- Direct API calls (using `fetch`)
- History tracking logic
- Error handling

**RecordList.tsx:**
- Filter state management (`fltr`)
- Summary count computation (inline)
- History rendering (inline)
- Filter UI rendering (inline, duplicates `RecordFilter` component)
- Record selection state

**RecordDetailDialog.tsx:**
- Form state (status, note)
- No save handler (broken functionality)

---

## Issues Identified

### 1. Naming Inconsistencies

**Problem:** Internal state variables use different names than their public API counterparts.

```typescript
// RecordsContext.tsx - Current state
const [data, setData] = useState([]);        // Internal: "data"
const [busy, setBusy] = useState(false);     // Internal: "busy"
const [err, setErr] = useState(null);        // Internal: "err"
const [log, setLog] = useState([]);          // Internal: "log"

// Exposed as:
const value = {
  records: data,    // Translation: data → records
  loading: busy,    // Translation: busy → loading
  error: err,       // Translation: err → error
  history: log,     // Translation: log → history
};
```

**Impact:** Reduced clarity and higher congnitive load.

**Solution:** Use consistent naming where internal names match public API.

### 2. Mixed Responsibilities

**Problem:** `RecordsContext` handles multiple concerns:
- Direct API calls (using `fetch`)
- State management
- History tracking
- Error handling

**Impact:**
- Difficult to test API logic independently
- Cannot swap API implementation easily
- Cannot reuse API functions elsewhere
- Violates Single Responsibility Principle

**Solution:** Extract API calls to a service layer (Repository/Service pattern).

### 3. Stale Closure in Update Logic

**Problem:** The `doUpdate` function uses stale state from closure:

```typescript
// RecordsContext.tsx - Line 85
const prevRecord = data.find((r) => r.id === id); // Uses stale 'data'
```

**Impact:**
- Could lead to incorrect history entries during concurrent updates
- Function recreates when `data` changes (line 101: `}, [data])`)
- Potential race conditions

**Solution:** Capture the latest records state via a `useRef` snapshot to avoid stale closures inside async callbacks.  
This keeps the update function referentially stable while ensuring history entries are derived from the most recent state.

### 4. Code Duplication

**Problem:** `RecordList` duplicates logic that exists in separate components:

- **Summary counts** (lines 21-29): Duplicates `RecordSummary` component logic
- **History rendering** (lines 96-129): Duplicates `HistoryLog` component logic
- **Filter UI** (lines 45-62): Duplicates `RecordFilter` component logic

**Impact:**
- Code duplication
- Inconsistency risk
- Maintenance burden
- Existing components are unused

**Solution:** Replace inline UI with `RecordFilter`, `RecordSummary`, and `HistoryLog` components.
Remaining: deeper UX + validation + save wiring stays in Phase 2.

### 5. Feature Logic Present but Not Wired

**Problem:** 
- Filter wired using `useFilteredRecords`
- Save button exists without handler

**Impact:**
- Filter functionality works after wiring using `useFilteredRecords`.
- Save functionality doesn't work

**Solution:** 
- Filter (Phase 1): Wired filtering via `useFilteredRecords`.
- Add save handler and validation (Phase 2).

### 6. Abbreviated Variable Names

**Problem:** Variables use abbreviations that reduce readability:

```typescript
// RecordList.tsx
const [sel, setSel] = useState(...);   // Should be: selectedRecord
const [fltr, setFltr] = useState(...); // Should be: filterStatus
```

**Impact:**
- Reduced code readability
- Harder to understand intent

**Solution:** Use descriptive, full names.

---

## Refactoring Approach

### Phase 1 Focus: Architecture & Code Quality

**Goal:** Improve code structure, naming consistency, and separation of concerns without implementing new features.

**Scope:**
- Extract service layer for API calls
- Fix naming inconsistencies
- Fix stale closure bug
- Created hooks for derived state
- Integrate derived hooks + extracted components into RecordList
- Improve code organization
- Filter functionality
- Save functionality deferred to Phase 2
- Integrating existing components deferred to Phase 2

### Refactoring Strategy

1. **Extract Service Layer** - Isolate API calls
2. **Fix Naming** - Consistent internal/external names
3. **Fix Stale Closure** - Use functional updates
4. **Create Derived State Hooks** - Use in RecordList to replace inline derived computations
5. **Improve Comments** - Clarify responsibilities

---

## Design Patterns to Apply

### Pattern 1: Repository/Service Pattern

**Purpose:** Isolate API communication from state management.

**Implementation Plan:**
- Create `services/recordsApi.ts`
- Move all `fetch/patch` calls to service
- Context orchestrates using service

**Benefits:**
- Testable (can mock service)
- Swappable (easy to replace API)
- Reusable (can use outside context)
- Maintainable (API changes isolated)

### Pattern 2: Hooks for Derived State

**Purpose:** Extract computed values into memoized hooks.

**Implementation Plan:**
- Create `hooks/useFilteredRecords.ts` (prepared for Phase 2)
- Create `hooks/useStatusCounts.ts` (prepared for Phase 2)
- Use `useMemo` for performance

**Benefits:**
- Performance (memoization)
- Reusability (multiple components)
- Testability (independent testing)
- Clarity (explicit derived state)

---

## Architectural Decisions

### Decision: Context Orchestrates

**Choice:** Context manages state and orchestrates side effects using the service layer.

**Rationale:**
- Aligns with provided architecture
- Avoids unnecessary abstraction
- Common, readable React pattern

**Trade-off:** Context owns more responsibility, but architecture remains simpler.

---

## Proposed File Structure

```
interview/
├── components/              
│   ├── RecordCard.tsx       
│   ├── RecordFilter.tsx     
│   ├── RecordSummary.tsx    
│   ├── HistoryLog.tsx       
│   ├── RecordList.tsx       
│   └── RecordDetailDialog.tsx 
│
├── context/
│   └── RecordsContext.tsx  
│
├── services/                
│   └── recordsApi.ts       
│
├── hooks/                   
│   ├── useRecords.ts        
│   ├── useFilteredRecords.ts 
│   └── useStatusCounts.ts   
│
└── types/
    └── index.ts            
```

---

## State Flow Analysis (High Level)

### Current State Flow

- context fetches data directly
- Derived state computed inline
- History logic mixed with update logic
- Filter state unused

### Proposed State Flow (After Refactoring)

- context orchestrates via service layer
- Derived state extracted to hooks
- Updated logic uses functional state updates
- Clean seams for Phase 2 wiring

---

## Phase 1 vs Phase 2 Boundaries

### Phase 1 (Architecture)
- Extract service layer
- Fix naming inconsistencies
- Fix stale closure bug
- Create derived state hooks (prepared)
- Improve code organization

### Phase 2 (Features)
- Wire up filter functionality
- Implement save functionality
- Integrate existing components
- Add validation
- Wire up prepared hooks

---

## Next Steps

The next commits will implement this plan incrementally:

1. Extract service layer
2. Refactor context and fix stale closure
3. Introduce derived state hooks
4. Clean up container responsibilities

