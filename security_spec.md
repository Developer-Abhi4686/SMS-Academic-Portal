# Security Specification for Academic Portal

## Data Invariants
1. **User Profiles**: Only the owner can read/write their own profile.
2. **Attendance**: Only teachers can read/write attendance records.
3. **Memories**: Strictly private to the creator.
4. **Vaults**:
   - Only teachers can create vaults.
   - Only the vault owner can manage (update/delete) the vault.
   - Vault files can be created by any signed-in user (Remote Drop feature) but only if they are authenticated and providing valid metadata.
   - Vault files can only be read/deleted by the vault owner.
5. **Classroom Data**: `students_*` collections are read-only for authenticated teachers.

## The "Dirty Dozen" Payloads (Attack Vectors)

1. **Identity Spoofing**: 
   ```json
   { "ownerId": "victim_uid", "name": "Hack Vault" }
   ```
   *Target*: `/vaults/new`. *Action*: Create. *Result*: DENIED.

2. **Privilege Escalation**:
   ```json
   { "role": "teacher" }
   ```
   *Target*: `/users/student_uid`. *Action*: Update. *Result*: DENIED.

3. **Ghost Field Injection**:
   ```json
   { "isAdmin": true, "fullName": "Alice" }
   ```
   *Target*: `/users/alice_uid`. *Action*: Create/Update. *Result*: DENIED.

4. **Resource Exhaustion (ID Poisoning)**:
   ```json
   ID: "a".repeat(2000)
   ```
   *Target*: `/vaults/long_id`. *Action*: Get/Create. *Result*: DENIED.

5. **Cross-User Data Leak**:
   *Action*: List `/memories` where `userId != current_uid`. *Result*: DENIED.

6. **Immutable Field Manipulation**:
   ```json
   { "createdAt": "2020-01-01" }
   ```
   *Target*: `/users/user_uid`. *Action*: Update. *Result*: DENIED.

7. **Unauthorized Attendance Write**:
   *User*: Student. *Action*: Write to `/attendance/today`. *Result*: DENIED (Only teachers).

8. **Size Attack (Denial of Wallet)**:
   ```json
   { "title": "A".repeat(1000) }
   ```
   *Target*: `/memories/m1`. *Action*: Create. *Result*: DENIED (Max 200 chars).

9. **Orphaned File Write**:
   *Action*: Create `/vaults/non_existent_vault/files/f1`. *Result*: DENIED (Parent vault must exist).

10. **Shadow Key Update**:
    ```json
    { "passwordHash": "new_hash", "malicious_key": "some_value" }
    ```
    *Target*: `/vaults/v1`. *Action*: Update. *Result*: DENIED (affectedKeys mismatch).

11. **Type Poisoning**:
    ```json
    { "subject": ["Math", "Physics"] }
    ```
    *Target*: `/vaults/v1`. *Action*: Update (expects string). *Result*: DENIED.

12. **Future Timestamp Fraud**:
    ```json
    { "updatedAt": "2030-01-01" }
    ```
    *Target*: `/memories/m1`. *Action*: Update. *Result*: DENIED (Requires `request.time`).

## Conflict Report

| Requirement | Spoofing | Shortcutting | Poisoning | Status |
| :--- | :---: | :---: | :---: | :---: |
| User Profiles | Protected | Protected | Protected | ✅ |
| Vault Access | Protected | Protected | Protected | ✅ |
| Memory Isolation | Protected | Protected | Protected | ✅ |
| Attendance Logic | Protected | Protected | Protected | ✅ |
