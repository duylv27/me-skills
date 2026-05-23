---
name: api-contract-review
description: Review REST API design for correctness, consistency, versioning, validation, error responses, and OpenAPI documentation. Use when user says "review API", "check REST endpoints", "is this API design correct", "API contract", "REST design", "HTTP status codes", "OpenAPI / Swagger", or when designing or reviewing REST controllers.
---

# API Contract Review Skill

Review REST APIs for design correctness, consumer-friendliness, and production readiness.

## When to Use
- Reviewing or designing REST controllers
- Checking HTTP method, status code, and URL conventions
- Validating error response format and input validation
- Reviewing OpenAPI / Swagger documentation
- Pre-PR review of any `@RestController` class

---

<rules>
- Every controller method must return `ResponseEntity<T>` — never a bare domain object.
- All request bodies and query params must be annotated with `@Valid` / `@Validated`.
- Error responses must use RFC 7807 `ProblemDetail` — not custom ad-hoc JSON shapes.
- Never expose JPA entities in API responses — always use DTOs / records.
- API version in URL path (`/api/v1/`) — not in headers for new APIs.
- Breaking changes require a new version; never change a field type or remove a field in the same version.
</rules>

---

<workflow>

## HTTP Method and Status Code Reference

| Operation | Method | Success Status | Notes |
|-----------|--------|---------------|-------|
| Fetch single resource | `GET` | `200 OK` | `404` if not found |
| Fetch collection | `GET` | `200 OK` | Empty array `[]`, never `404` |
| Create resource | `POST` | `201 Created` | Include `Location` header |
| Full replace | `PUT` | `200 OK` | `404` if not found |
| Partial update | `PATCH` | `200 OK` | `404` if not found |
| Delete | `DELETE` | `204 No Content` | `404` if not found |
| Async operation | `POST` | `202 Accepted` | Include status URL |

---

## URL Design Rules

```
# ✅ Correct patterns
GET    /api/v1/users            # list
GET    /api/v1/users/{id}       # single
POST   /api/v1/users            # create
PUT    /api/v1/users/{id}       # full replace
PATCH  /api/v1/users/{id}       # partial update
DELETE /api/v1/users/{id}       # delete

GET    /api/v1/users/{id}/orders  # nested resource (use sparingly, max 1 level)

# ❌ Anti-patterns
POST   /api/v1/getUser          # verb in URL
GET    /api/v1/user             # singular resource name
POST   /api/v1/users/create     # redundant action noun
DELETE /api/v1/users            # delete all (dangerous, needs explicit scope)
```

---

## Controller Review Checklist

### Design (P1)
- [ ] Resource names are plural nouns: `/users`, `/orders`, `/products`
- [ ] No verbs in URLs — actions expressed via HTTP method
- [ ] Consistent versioning: `/api/v1/` prefix on all routes
- [ ] Nested resources limited to 1 level deep
- [ ] Query params for filtering/sorting/pagination — not path segments

### Status Codes (P2)
- [ ] `POST` returns `201 Created` with `Location` header
- [ ] `DELETE` returns `204 No Content`
- [ ] Empty collections return `200 []` — not `404`
- [ ] `404` only when the resource itself doesn't exist — not when result set is empty
- [ ] Validation failures return `400 Bad Request`
- [ ] Auth failures return `401 Unauthorized` (not authenticated) or `403 Forbidden` (not allowed)
- [ ] Unexpected errors return `500` — never expose stack traces

### Input Validation (P3)
- [ ] `@Valid` on every `@RequestBody` parameter
- [ ] `@Validated` on the controller class for method-level validation (path vars, query params)
- [ ] Validation annotations on DTO fields (`@NotBlank`, `@Email`, `@Min`, `@Max`, `@Size`)
- [ ] `MethodArgumentNotValidException` handled in `@RestControllerAdvice`

### Response Shape (P4)
- [ ] No JPA entities returned — DTOs / records only
- [ ] No `null` fields in responses — use `Optional` or omit with `@JsonInclude(NON_NULL)`
- [ ] Consistent field naming: `camelCase` in JSON
- [ ] Timestamps in ISO 8601: `"2026-05-23T10:15:30Z"`
- [ ] Monetary values as strings or integer cents — never floating-point

### Error Responses (P5)
- [ ] All errors use RFC 7807 `ProblemDetail` — consistent shape across all endpoints
- [ ] Error response includes: `type` (URI), `title`, `status`, `detail`
- [ ] No internal exception class names or stack traces in error body
- [ ] Validation errors list all field violations — not just the first one

### Documentation (P6)
- [ ] `@Operation`, `@ApiResponse` on all endpoints
- [ ] All response codes documented (200, 201, 400, 404, 500 as applicable)
- [ ] Request/response DTOs fully annotated with `@Schema`

---

## Code Examples

### Controller Template (Production-Ready)

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Validated
@Tag(name = "Users", description = "User management")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "List all users")
    @ApiResponse(responseCode = "200", description = "User list")
    public ResponseEntity<List<UserResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.findAll(page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    @ApiResponse(responseCode = "200", description = "User found")
    @ApiResponse(responseCode = "404", description = "User not found")
    public ResponseEntity<UserResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new user")
    @ApiResponse(responseCode = "201", description = "User created")
    @ApiResponse(responseCode = "400", description = "Validation error")
    public ResponseEntity<UserResponse> create(
            @Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete user")
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}
```

### Error Response (RFC 7807 ProblemDetail)

```java
// ✅ Always use ProblemDetail — never custom ad-hoc JSON
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(ResourceNotFoundException ex) {
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setType(URI.create("/errors/not-found"));
        pd.setTitle("Resource Not Found");
        return ResponseEntity.of(pd).build();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(
            MethodArgumentNotValidException ex) {
        List<String> violations = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .toList();
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
            "Validation failed: " + violations);
        pd.setType(URI.create("/errors/validation"));
        return ResponseEntity.of(pd).build();
    }
}
```

### Pagination Response

```java
// ✅ Use Spring Data Page — don't reinvent pagination
@GetMapping
public ResponseEntity<Page<UserResponse>> list(
        @ParameterObject Pageable pageable) {
    return ResponseEntity.ok(userService.findAll(pageable));
}

// Response shape includes: content[], totalElements, totalPages, number, size
```

---

## Versioning Strategy

```
Version in path (recommended for new APIs):
  /api/v1/users
  /api/v2/users   ← new version when breaking changes needed

Never:
  /api/users?version=1    ← query param versioning (hard to route)
  Accept: application/vnd.api.v1+json  ← header versioning (hard to test in browser)
```

**Breaking changes** (require new version):
- Removing a field from the response
- Changing a field type
- Changing a URL path segment
- Changing HTTP method

**Non-breaking changes** (safe in same version):
- Adding a new optional field to the response
- Adding a new optional query param
- Adding a new endpoint

---

## Output Format

```
## API Contract Review: [Controller / endpoint]

### P1 — Design
- [ ✅ / ❌ ] [Check] — [finding]

### P2 — Status Codes
- [ ✅ / ❌ ] [Check]

### P3 — Input Validation
- [ ✅ / ❌ ] [Check]

### P4 — Response Shape
- [ ✅ / ❌ ] [Check]

### P5 — Error Responses
- [ ✅ / ❌ ] [Check]

### Critical Findings
[Any ❌ items with concrete fix]
```
</workflow>