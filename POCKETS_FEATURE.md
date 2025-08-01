# Feature Implementation: Pockets

This document outlines the steps taken to implement the "Pockets" (or Accounts/Wallets) feature in the Clarity Finance application.

## Phase 1: Database & Backend Foundation
- [x] Create database migration for the `pockets` table (`id`, `user_id`, `name`, `balance`, `icon`, `color`, `is_default`).
- [x] Update `transactions` table migration to add `pocket_id` foreign key.
- [x] Write data migration script to create a default pocket for existing users and backfill their transactions.
- [x] Create Supabase Edge Function for basic Pocket CRUD (Create, Read, Update).
- [x] Create the special `deletePocket` Edge Function with the cascading logic.
- [x] Modify the `createTransaction` and `updateTransaction` functions to correctly adjust pocket balances.

## Phase 2: Frontend Integration
- [x] Update `AppContext` to fetch, store, and manage pockets state.
- [x] Create a new page for managing pockets (`/pockets`).
- [x] Build the UI for the Pockets page (list pockets, show balances, add/edit buttons).
- [x] Create the "Add/Edit Pocket" form component.
- [x] Update the `TransactionForm` to include a pocket selector dropdown.

## Phase 3: Core Features & Polish
- [x] Implement the "Transfer between pockets" feature (UI and backend logic).
- [x] Update the Dashboard to display balances per pocket and a total balance.
- [ ] Update the Reports page to allow filtering by pocket.
- [ ] Ensure all UI components are responsive and provide good user feedback (loading states, errors).