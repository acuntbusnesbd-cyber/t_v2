# Security Specification for KajKormo (কাজকর্ম)

## 1. Data Invariants
1. **Identity Isolation (User Scoping)**: A user can NEVER read, create, update, or delete any task where `userId != request.auth.uid`.
2. **Immutable User Ownership**: Once created, `userId` and `createdAt` cannot be altered in any update operation.
3. **Temporal Integrity**: `createdAt` must strictly equal `request.time` on creation; `updatedAt` must equal `request.time` on create and update.
4. **Boundary & Type Constraints**:
   - `title` must be a non-empty string between 1 and 200 characters.
   - `description` if provided must be a string up to 2000 characters.
   - `priority` must strictly be one of `['low', 'medium', 'high']`.
   - `status` must strictly be one of `['pending', 'in_progress', 'completed']`.
   - Document IDs must conform to `^[a-zA-Z0-9_\-]+$` and length <= 128 characters.
5. **No Orphaned or Spoofed Records**: Only authenticated users can write tasks or update their user profile.

---

## 2. The "Dirty Dozen" Payloads (Must be REJECTED with PERMISSION_DENIED)
1. **Unauthenticated Read/Write**: Attempting to list `/tasks` without an active Firebase Auth token.
2. **Identity Spoofing on Create**: Attacker `user_A` writes a task with `userId: "user_B"`.
3. **Cross-User Snooping (List Query Bypass)**: Attacker `user_A` executes a query for tasks where `userId == "user_B"`.
4. **Cross-User Direct Get**: Attacker `user_A` performs a direct document get on `/tasks/{taskId}` belonging to `user_B`.
5. **Cross-User Modification**: Attacker `user_A` attempts to update title/status of a task owned by `user_B`.
6. **Cross-User Deletion**: Attacker `user_A` attempts to delete a task owned by `user_B`.
7. **Ghost Field Injection (Shadow Update)**: Attacker attempts to update a task and inject `{ "isAdmin": true, "role": "superuser" }`.
8. **Ownership Hijack (Immutable Field Mutation)**: User attempts to update their task but mutate `userId` to another account or transfer ownership.
9. **Creation Timestamp Spoofing**: User sends a task with `createdAt: timestamp(2020-01-01)` instead of `request.time`.
10. **Title Denial-of-Wallet (Oversized Payload)**: Attacker submits a task with a `title` containing 50,000 characters.
11. **Invalid Enum Poisoning**: Attacker sends a task with `priority: "super_critical_destroy"` or `status: "deleted"`.
12. **Malformed Path Variable Injection**: Attacker attempts to write to a document ID with 2KB special/control characters.

---

## 3. Test Matrix & Invariant Verification
All 12 vectors are audited against the Fortress rules and verified to return `PERMISSION_DENIED` across all client operations.
