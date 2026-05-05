# Plan: Fix Package Detail System & Expand Database Content

## Overview

Fix the broken tab system on the Package Detail page (currently only Overview tab shows data — Itinerary, Pricing, Inclusions, and Departures tabs render empty). Also expand the database from 3 packages to 25+ across 10 destinations with full rich data per package.

## Root Cause Analysis

After exploring the codebase, I found several bugs:

1. **TabNavigation prop mismatch**: `PackageDetail.jsx` passes `onChange={(id) => setActiveTab(id)}` but `TabNavigation.jsx` expects `onTabChange` — tab clicks fire nothing, so tabs never switch.

2. **ItineraryTimeline only shows locations/activities**: The new schema has `morningActivity`, `afternoonActivity`, `eveningActivity`, `nightActivity` per day — these are returned by the API but the component doesn't render them.

3. **Destination counts are hardcoded**: Homepage says "Shimla — 12 packages" but only 1 exists. Need real DB counts.

4. **Only 3 packages**: Need 25+ packages across 10 destinations for a real travel platform feel.

## Files to Modify

1. `frontend/src/components/ui/TabNavigation.jsx` — accept both `onChange` and `onTabChange`
2. `frontend/src/components/ui/ItineraryTimeline.jsx` — time-slotted layout with morning/afternoon/evening/night
3. `frontend/src/components/ui/PricingTable.jsx` — add `onSelect`/`selectedRoom` support
4. `frontend/src/pages/PackageDetail.jsx` — loading skeletons, empty states, Videos tab
5. `frontend/src/pages/Home.jsx` — real destination counts from API
6. `frontend/src/services/packageService.js` — add `getDestinationCounts()`
7. `backend/src/controllers/packages.controller.js` — add `getDestinationCounts`
8. `backend/src/routes/packages.routes.js` — add route
9. `backend/prisma/seed.js` — 25+ packages across 10 destinations

## Execution Order

1. Fix `TabNavigation.jsx` prop compat
2. Rewrite `ItineraryTimeline.jsx`
3. Fix `PricingTable.jsx` add select support
4. Fix `PackageDetail.jsx` — loading states, empty states, Videos tab
5. Add destination-counts API endpoint + route
6. Update `Home.jsx` to use real counts
7. Rewrite `seed.js` with 25+ packages
8. Run `npx prisma db seed`
9. Verify: all tabs work, homepage shows real counts, 25+ packages load
