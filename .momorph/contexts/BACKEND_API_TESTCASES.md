# Backend API Test Cases

**Project**: SAA 2025 — Kudos
**API Version**: v1
**Generated**: 2026-04-20
**Last Updated**: 2026-04-20
**Source screen**: `ihQ26W78P2` (Viết Kudo)

---

## Overview

Functional test cases for the backend endpoints that support the **Viết Kudo** modal.
Derived from:
- `spec.md` (user stories, FRs, TRs)
- `api-docs.yaml` (OpenAPI contract)
- Frontend test cases (`get_frame_test_cases` — filtered for `test_area = FUNCTION`)

### Test Case Categories

| Category | Description | Priority |
|----------|-------------|----------|
| Positive | Valid inputs → expected success | P1 |
| Negative | Invalid inputs → expected error | P1 |
| Boundary | Edge values, limits (min/max hashtags, images) | P2 |
| Validation | Format, required fields | P1 |
| Auth | Authorization checks | P1 |
| Integration | Cross-endpoint flows (upload → create kudo) | P2 |

### Test Case ID Format

```
{ENDPOINT}_{NUMBER}
Example: KUDO_CREATE_01, EMP_SEARCH_03
```

---

## Kudos

### POST /kudos

#### Description
Create a Kudo with recipient, title, body, hashtags, images, and anonymity flag.

#### Request
```json
{
  "recipientId": "int64 (required, = employees.id)",
  "titleId": "int64 (optional — mutually exclusive with titleName)",
  "titleName": "string 2–60 chars (optional — inline-create new Danh hiệu)",
  "body": "object — ProseMirror JSON (required)",
  "hashtags": "Array<{id: int64} | {label: string}> (required, 1-5)",
  "imageIds": "int64[] (optional, 0-5 unique)",
  "isAnonymous": "boolean (optional, default false)",
  "anonymousAlias": "string ≤60 chars (optional, only with isAnonymous=true)"
}
```

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| KUDO_CREATE_01 | Positive | Full valid payload, not anonymous | `{"recipientId":1024,"titleId":7,"body":{doc},"hashtags":[{"id":12},{"id":34}],"imageIds":[901,902],"isAnonymous":false}` | `{"data":{"id":...,"senderName":"...","recipientName":"..."}}` | 201 |
| KUDO_CREATE_02 | Positive | Minimum valid payload (1 hashtag, 0 images, not anon) | `{"recipientId":1024,"titleId":7,"body":{...},"hashtags":[{"id":12}]}` | Kudo created | 201 |
| KUDO_CREATE_03 | Positive | Anonymous submit with alias | `{"recipientId":1024,"titleId":7,"body":{...},"hashtags":[{"id":12}],"isAnonymous":true,"anonymousAlias":"Thỏ 7 màu"}` | `data.isAnonymous=true`, `data.senderName="Thỏ 7 màu"`; `GET /kudos` returns no `author` | 201 |
| KUDO_CREATE_04 | Positive | Body contains `@mention`; mentions persisted | body has mention node with `{id: 1088}` (int64) | `data.mentions` contains employee 1088 | 201 |
| KUDO_CREATE_04a | Positive | Inline-create new Danh hiệu via `titleName` | `{"recipientId":1024,"titleName":"Người truyền cảm hứng","body":{...},"hashtags":[{"id":12}]}` | New title row created; Kudo references it | 201 |
| KUDO_CREATE_04b | Positive | Inline-create new hashtag via `{label}` | `hashtags: [{"id":12}, {"label":"team_work"}]` | New hashtag row created with slug `team_work`; Kudo tagged with both | 201 |
| KUDO_CREATE_05 | Boundary | Exactly 5 hashtags, 5 images | `hashtags: 5 items`, `imageIds: [901..905]` | Created | 201 |
| KUDO_CREATE_06 | Validation | Missing recipientId | `{"titleId":7,"body":{...},"hashtags":[{"id":12}]}` | `{"error":{"code":"VALIDATION_ERROR","details":{"recipientId":["Required"]}}}` | 422 |
| KUDO_CREATE_07 | Validation | Missing both titleId and titleName | `{"recipientId":1024,"body":{...},"hashtags":[{"id":12}]}` | `details.title: ["Provide titleId or titleName"]` | 422 |
| KUDO_CREATE_08 | Validation | Empty / whitespace-only body | `{"body":{"type":"doc","content":[]}, ...}` | `details.body: ["Required"]` | 422 |
| KUDO_CREATE_09 | Validation | Zero hashtags | `hashtags: []` | `details.hashtags: ["Must contain 1–5 items"]` | 422 |
| KUDO_CREATE_10 | Boundary | 6 hashtags | `hashtags: 6 items` | `details.hashtags: ["Must contain 1–5 items"]` | 422 |
| KUDO_CREATE_11 | Boundary | 6 images | `imageIds: [1..6]` | `details.imageIds: ["Must contain 0–5 items"]` | 422 |
| KUDO_CREATE_12 | Validation | Duplicate hashtag IDs | `hashtags: [{"id":12},{"id":12}]` | `details.hashtags: ["Must be unique"]` | 422 |
| KUDO_CREATE_13 | Negative | Kudo self (recipient == author) | `recipientId = <caller.id>` | `{"error":{"code":"VALIDATION_ERROR","details":{"recipientId":["Không thể gửi Kudo cho chính mình"]}}}` | 422 |
| KUDO_CREATE_14 | Negative | Recipient deactivated | recipient has `deleted_at NOT NULL` | `details.recipientId: ["Recipient is no longer active"]` | 422 |
| KUDO_CREATE_15 | Negative | Recipient id does not exist | `recipientId: 999999` | `details.recipientId: ["Not found"]` | 422 |
| KUDO_CREATE_15a | Validation | Non-integer recipientId | `recipientId: "abc"` | `details.recipientId: ["Must be a positive integer"]` | 422 |
| KUDO_CREATE_16 | Negative | titleId does not exist / soft-deleted | `titleId: 999999` | `details.titleId: ["Invalid title"]` | 422 |
| KUDO_CREATE_16a | Validation | titleName too short | `titleName: "A"` | `details.titleName: ["2–60 characters"]` | 422 |
| KUDO_CREATE_17 | Negative | hashtagId does not exist | `hashtags: [{"id":12},{"id":999999}]` | `details.hashtags: ["Invalid hashtag id: 999999"]` | 422 |
| KUDO_CREATE_17a | Validation | hashtag label invalid charset | `hashtags: [{"label":"team work!"}]` | `details.hashtags: ["Chỉ gồm chữ, số, gạch dưới; 2–32 ký tự"]` | 422 |
| KUDO_CREATE_18 | Negative | imageId does not belong to caller | `imageIds` references another user's upload | `{"error":{"code":"FORBIDDEN"}}` | 403 |
| KUDO_CREATE_19 | Negative | imageId already attached to another kudo | reuse upload across kudos | `details.imageIds: ["Already attached"]` | 422 |
| KUDO_CREATE_19a | Validation | anonymousAlias > 60 chars | `anonymousAlias: "..." (61 chars)` | `details.anonymousAlias: ["Tối đa 60 ký tự"]` | 422 |
| KUDO_CREATE_19b | Negative | anonymousAlias set but isAnonymous=false | `{isAnonymous: false, anonymousAlias: "Thỏ"}` | Server ignores alias OR rejects with `details.anonymousAlias: ["Only allowed when isAnonymous=true"]` | 422 |
| KUDO_CREATE_20 | Negative | body contains `<script>` tag | Body JSON with raw HTML-escape attempt | Server strips disallowed nodes, stores sanitized body; 201 | 201 |
| KUDO_CREATE_21 | Negative | body is malformed JSON schema (not ProseMirror) | `{"body":"just a string"}` | `details.body: ["Must be a ProseMirror document"]` | 422 |
| KUDO_CREATE_22 | Boundary | body_plain > 5000 chars | 5001-char text | `details.body: ["Max 5000 characters"]` | 422 |
| KUDO_CREATE_23 | Auth | No token | No `Authorization` header | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |
| KUDO_CREATE_24 | Auth | Expired token | Expired JWT | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |
| KUDO_CREATE_25 | Negative | Duplicate submit (idempotency) | Replay the same request within 2 s | Second request returns the already-created Kudo (same `id`) or is rate-limited; no duplicate row | 201/409 |

Maps frontend TC: ID-46, ID-47, ID-48, ID-49, ID-50, ID-51, ID-52, ID-56 (validation), ID-41..44 (anonymous).

---

### GET /kudos

#### Description
Paginated list of published kudos for the board.

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| KUDO_LIST_01 | Positive | Default pagination | No params | `{"data":[...],"meta":{"page":1,"limit":20}}`, newest first | 200 |
| KUDO_LIST_02 | Positive | Filter by titleId | `?titleId=7` | All items have `title.id=7` | 200 |
| KUDO_LIST_03 | Positive | Filter by hashtagId | `?hashtagId=12` | All items have hashtag 12 in `hashtags[]` | 200 |
| KUDO_LIST_04 | Positive | Anonymous Kudo in feed | A kudo with `isAnonymous=true` is returned | `author === null`, `isAnonymous=true` | 200 |
| KUDO_LIST_05 | Boundary | `limit=100` (max) | `?limit=100` | `meta.limit = 100` | 200 |
| KUDO_LIST_06 | Boundary | `limit=200` (over max) | `?limit=200` | `{"error":{"code":"VALIDATION_ERROR"}}` or capped to 100 | 422/200 |
| KUDO_LIST_07 | Boundary | `page=0` | `?page=0` | Validation error | 422 |
| KUDO_LIST_08 | Boundary | `page` beyond last | `?page=9999` | `{"data":[],"meta":{...}}` | 200 |
| KUDO_LIST_09 | Negative | Hidden / reported kudo excluded | A `status=hidden` record exists | Not in `data[]` | 200 |
| KUDO_LIST_10 | Auth | No token | No auth | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |

---

## Titles (Danh hiệu)

### GET /titles

#### Description
List all active Danh hiệu, ordered by `sort_order`.

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| TITLE_LIST_01 | Positive | Default request | No params | `{"data":[{"id":...,"name":"..."}]}` ordered by sortOrder asc | 200 |
| TITLE_LIST_02 | Positive | Soft-deleted titles excluded | Seed an active + a deleted title | Only active appears in `data[]` | 200 |
| TITLE_LIST_03 | Boundary | Empty master list | DB has 0 active titles | `{"data":[]}` | 200 |
| TITLE_LIST_04 | Auth | No token | No auth | Unauthorized | 401 |

---

## Hashtags

### GET /hashtags

#### Description
Search / list active hashtags.

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| HASHTAG_LIST_01 | Positive | No query, default limit | No params | Top hashtags by `usageCount desc`, 20 items | 200 |
| HASHTAG_LIST_02 | Positive | Prefix search | `?q=team` | All results have slug starting with `team` | 200 |
| HASHTAG_LIST_03 | Positive | Case-insensitive | `?q=TEAM` vs `?q=team` | Same result set | 200 |
| HASHTAG_LIST_04 | Positive | Leading/trailing spaces trimmed | `?q=%20team%20` | Same as `?q=team` | 200 |
| HASHTAG_LIST_05 | Positive | No match | `?q=zzzzz` | `{"data":[]}` | 200 |
| HASHTAG_LIST_06 | Boundary | `limit=100` | `?limit=100` | At most 100 items | 200 |
| HASHTAG_LIST_07 | Boundary | `limit=0` | `?limit=0` | Validation error | 422 |
| HASHTAG_LIST_08 | Auth | No token | No auth | Unauthorized | 401 |

Maps frontend TC: ID-34, ID-35.

---

## Uploads

### POST /uploads

#### Description
Upload a single image (JPG / PNG / WebP, ≤ 5 MB).

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| UPLOAD_01 | Positive | Valid JPG | `file: cat.jpg (1.2 MB)` | `{"data":{"id":...,"url":"...","mimeType":"image/jpeg"}}` | 201 |
| UPLOAD_02 | Positive | Valid PNG | `file: logo.png (800 KB)` | `mimeType: "image/png"` | 201 |
| UPLOAD_03 | Positive | Valid WebP | `file: photo.webp (700 KB)` | `mimeType: "image/webp"` | 201 |
| UPLOAD_04 | Boundary | Exactly 5 MB | `file: 5MB.jpg` | Created | 201 |
| UPLOAD_05 | Boundary | 5 MB + 1 byte | `file: 5MB+.jpg` | `{"error":{"code":"PAYLOAD_TOO_LARGE"}}` | 413 |
| UPLOAD_06 | Boundary | 0-byte file | empty file | `{"error":{"code":"VALIDATION_ERROR","details":{"file":["Empty file"]}}}` | 422 |
| UPLOAD_07 | Validation | PDF rejected | `file: doc.pdf` | `{"error":{"code":"UNSUPPORTED_MEDIA_TYPE"}}` | 415 |
| UPLOAD_08 | Validation | MP4 rejected | `file: movie.mp4` | `{"error":{"code":"UNSUPPORTED_MEDIA_TYPE"}}` | 415 |
| UPLOAD_09 | Validation | TXT rejected | `file: note.txt` | `{"error":{"code":"UNSUPPORTED_MEDIA_TYPE"}}` | 415 |
| UPLOAD_10 | Validation | Missing `file` field | form-data without file part | `details.file: ["Required"]` | 422 |
| UPLOAD_11 | Negative | Wrong extension but valid MIME sniff | `.jpg` file whose bytes are PNG | Accepted (server trusts sniff), `mimeType: image/png` | 201 |
| UPLOAD_12 | Negative | Malicious polyglot (PHP inside JPG) | crafted file | Rejected by sniff → 415 | 415 |
| UPLOAD_13 | Auth | No token | No auth | Unauthorized | 401 |

Maps frontend TC: ID-21, ID-22, ID-23, ID-24, ID-55.

---

### DELETE /uploads/{id}

#### Description
Remove an uploaded image that hasn't been attached to a Kudo yet.

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| UPLOAD_DEL_01 | Positive | Own upload, not attached | `DELETE /uploads/901` | 204 (no content), record soft-deleted | 204 |
| UPLOAD_DEL_02 | Negative | Not found | `/uploads/999999` | `{"error":{"code":"NOT_FOUND"}}` | 404 |
| UPLOAD_DEL_03 | Auth | Not owner | Caller ≠ `owner_id` | `{"error":{"code":"FORBIDDEN"}}` | 403 |
| UPLOAD_DEL_04 | Negative | Already attached to a Kudo | Upload linked in `kudo_images` | `{"error":{"code":"CONFLICT"}}` | 409 |
| UPLOAD_DEL_05 | Boundary | id = 0 | `/uploads/0` | Validation error | 422 |
| UPLOAD_DEL_06 | Auth | No token | No auth | Unauthorized | 401 |

Maps frontend TC: ID-39, ID-40.

---

## Employees

### GET /employees/search

#### Description
Single endpoint powering both the **Recipient picker** (`ignore_caller=true`, default) and the **`@mention` popover** (`ignore_caller=false`). Soft-deleted accounts are always excluded.

#### Query parameters
- `q` — required, min 1 char (trimmed)
- `ignore_caller` — optional boolean, default `true`
- `limit` — optional, 1–100, default 20

#### Test Cases

| ID | Category | Scenario | Input | Expected Output | Status |
|----|----------|----------|-------|-----------------|--------|
| EMP_SEARCH_01 | Positive | Recipient-mode default (ignore_caller omitted) | `?q=Nguyễn` | Active employees matching "Nguyễn"; caller NOT in results | 200 |
| EMP_SEARCH_02 | Positive | Explicit `ignore_caller=true` | `?q=Nguyễn&ignore_caller=true` | Same as EMP_SEARCH_01 | 200 |
| EMP_SEARCH_03 | Positive | Mention-mode — `ignore_caller=false` | `?q=Nguyễn&ignore_caller=false` | Active employees matching "Nguyễn"; caller MAY appear | 200 |
| EMP_SEARCH_04 | Positive | Trims leading/trailing spaces | `?q=%20%20Nguyễn%20%20` | Same result as `?q=Nguyễn` | 200 |
| EMP_SEARCH_05 | Positive | Case-insensitive | `?q=nguyen` | Matches "Nguyễn" (diacritic-insensitive) | 200 |
| EMP_SEARCH_06 | Positive | Caller excluded with default | `?q=<caller's own name>` | Caller not present in results | 200 |
| EMP_SEARCH_07 | Positive | Caller included with explicit opt-in | `?q=<caller's own name>&ignore_caller=false` | Caller present in results | 200 |
| EMP_SEARCH_08 | Positive | Deactivated excluded regardless of `ignore_caller` | `?q=<deleted_at not null user>` | Not present in results | 200 |
| EMP_SEARCH_09 | Positive | Email match | `?q=someone@sun-asterisk.com` | Employee with that email | 200 |
| EMP_SEARCH_10 | Positive | Prefix `@` stripped client-side for mentions | `?q=NguyenVanA&ignore_caller=false` | Returns NguyenVanA | 200 |
| EMP_SEARCH_11 | Positive | No match | `?q=zzzzz` | `{"data":[]}` | 200 |
| EMP_SEARCH_12 | Positive | Special chars sanitised | `?q=@%20%23%20$` | Treated as literal search, returns `[]` or filtered set; no 5xx | 200 |
| EMP_SEARCH_13 | Validation | Missing `q` | No `q` param | `details.q: ["Required"]` | 422 |
| EMP_SEARCH_14 | Validation | Empty `q` after trim | `?q=%20` | `details.q: ["Must be at least 1 char"]` | 422 |
| EMP_SEARCH_15 | Validation | Invalid `ignore_caller` value | `?q=a&ignore_caller=maybe` | `details.ignore_caller: ["Must be boolean"]` | 422 |
| EMP_SEARCH_16 | Boundary | `limit=100` | `?q=a&limit=100` | At most 100 items | 200 |
| EMP_SEARCH_17 | Boundary | `limit=101` | `?q=a&limit=101` | Validation error or capped to 100 | 422/200 |
| EMP_SEARCH_18 | Auth | No token | No auth | `{"error":{"code":"UNAUTHORIZED"}}` | 401 |

Maps frontend TC: ID-8, ID-9, ID-10, ID-12, ID-13, ID-25, ID-26, ID-33.

---

## Integration Test Scenarios

### Scenario 1 — Happy path: open modal → submit Kudo

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | `GET /titles` | List of Danh hiệu (200) |
| 2 | `GET /hashtags?q=` | Top hashtags (200) |
| 3 | `GET /employees/search?q=Nguyen` (defaults `ignore_caller=true`) | Recipient suggestions, caller excluded (200) |
| 3a | `GET /employees/search?q=Nguyen&ignore_caller=false` while typing `@` in body | Mention suggestions, caller may appear (200) |
| 4 | `POST /uploads` × 2 with valid JPGs | Two upload ids returned (201 × 2) |
| 5 | `POST /kudos` with recipientId + titleId + body + 2 hashtagIds + 2 imageIds + isAnonymous=false | Kudo created (201) |
| 6 | `GET /kudos?page=1&limit=20` | New kudo at top of `data[]` with full author + images + hashtags expanded |

### Scenario 2 — Anonymous Kudo never leaks author

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A `POST /kudos` with `isAnonymous=true` | 201, response echoes `author.id = A` to the creator |
| 2 | User B `GET /kudos` | Same kudo has `author = null`, `isAnonymous = true` |
| 3 | DB inspection: `kudos.author_id = A.id` | Author is retained for moderation |
| 4 | User B `GET /kudos/{id}` | `author = null` |

### Scenario 3 — Orphan upload cleanup

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | `POST /uploads` → id 901 | Upload created (201) |
| 2 | User closes modal without submitting | (no API call) |
| 3 | User optionally calls `DELETE /uploads/901` | 204 |
| 4 | If step 3 skipped, scheduled GC removes uploads older than `expires_at` that are not attached to any kudo | GC job outcome verified via `uploads.deleted_at` |

### Scenario 4 — Cannot Kudo yourself

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Caller `POST /kudos` with `recipientId = <caller.id>` | 422 with `VALIDATION_ERROR` and `details.recipientId` |
| 2 | DB: no row inserted | Verified |

### Scenario 5 — Exceed limits

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | `POST /uploads` × 5 | 5 upload ids (201 × 5) |
| 2 | `POST /uploads` × 1 (6th) | Upload itself succeeds (unlimited at upload stage) — client prevents via UI |
| 3 | `POST /kudos` with `imageIds` = 6 ids | 422, `details.imageIds: ["Must contain 0–5 items"]` |
| 4 | `POST /kudos` with `hashtagIds` = 6 ids | 422, `details.hashtagIds: ["Must contain 1–5 items"]` |

### Scenario 6 — Submit while session expired

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User opens modal, token valid | `GET /titles`, `GET /hashtags` → 200 |
| 2 | Access token expires mid-form | — |
| 3 | `POST /kudos` | 401, client refreshes token via `/auth/refresh` and retries |
| 4 | Retry with new token | 201, Kudo created |

---

## Test Data Requirements

### Seed Data

| Entity | Count | Purpose |
|--------|-------|---------|
| Employees (active) | ≥ 20 | Recipient search, mention list |
| Employees (deactivated) | 2 | Exclusion tests |
| Titles (active) | 10 | Danh hiệu list |
| Titles (soft-deleted) | 2 | Exclusion tests |
| Hashtags (active) | 30 | Listing / search |
| Hashtags (soft-deleted) | 2 | Exclusion |
| Uploads (caller-owned) | 5 | Image link / delete flows |
| Uploads (other-owner) | 1 | 403 test on DELETE |
| Kudos (published) | 30 | Board feed tests |
| Kudos (hidden) | 1 | Moderation exclusion |
| Kudos (reported) | 1 | Moderation exclusion |
| Kudos (anonymous) | 3 | Anonymity masking tests |

### Test User Credentials

| Email | Password | Role | Status |
|-------|----------|------|--------|
| user.a@sun-asterisk.com | User123! | employee | active |
| user.b@sun-asterisk.com | User123! | employee | active |
| locked@sun-asterisk.com | Locked123! | employee | deactivated |
| admin@sun-asterisk.com | Admin123! | admin | active |

---

## Notes

- Authentication endpoints (`/auth/login`, `/auth/refresh`, `/auth/logout`) are owned by the Login feature spec; tests here assume a working bearer flow.
- All test cases assume proper test database isolation (transaction rollback per test).
- Performance / rate-limit tests live in `performance-tests.md`.
- Security deep-dive (XSS payloads in `body`, SSRF via `mention` ids, idempotency keys, CSRF on multipart upload) belongs in `security-tests.md`.
- Mapping column "Maps frontend TC" references IDs from `get_frame_test_cases(ihQ26W78P2)` — see `spec.md` for traceability.
