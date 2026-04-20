# Security Specification for SMS Academīc Portal

## Data Invariants
1. Students cannot elevated their role to 'teacher'.
2. Users can only modify their own profiles (except for administrative overrides).
3. Teachers can list students to facilitate classroom management.
4. Memories (saved work) are strictly private to the owner.
5. All IDs must follow standard alphanumeric format.
6. All strings and arrays must have strict size limits to prevent resource exhaustion attacks.

## The "Dirty Dozen" Payloads (Red Team Targets)

1. **Identity Spoofing**: Logged in as UserA, try to update UserB's profile.
2. **Role Escalation**: Create or update profile with `role: "teacher"` as a normal student.
3. **Ghost Field Injection**: Add `isAdmin: true` to a user profile.
4. **Massive Payload**: Send a 1MB string in `fullName`.
5. **PII Leak**: Unauthenticated user trying to `get` a user profile.
6. **Query Scraping**: Authenticated student trying to `list` all users (including teachers).
7. **Orphaned Memory**: Create a memory with a `userId` that doesn't belong to the auth user.
8. **Invalid ID Poisoning**: Use `../../passwords` as a document ID.
9. **State Locking Bypass**: Trying to change `createdAt` on an existing profile.
10. **Terminal State Break**: (Not applicable yet, but future statuses will be locked).
11. **Relational Break**: Creating a memory without a valid user document existing.
12. **Email Spoofing**: Using an unverified email to access teacher-only features.

## Test Matrix

| Pillar | Payload ID | Strategy | Expected |
|--------|------------|----------|----------|
| 1      | 7          | exists() check on parent | DENY |
| 2      | 2, 3       | isValid[Entity] + hasOnly() | DENY |
| 3      | 8          | isValidId() check | DENY |
| 4      | 1          | isOwner() check | DENY |
| 5      | 4          | .size() limits | DENY |
| 6      | 5          | isSignedIn() && isOwner() | DENY |
| 7      | 11         | existsAfter() | DENY |
| 8      | 6          | resource.data.role == 'student' | DENY (if not specific) |
