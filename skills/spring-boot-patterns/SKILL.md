---
name: spring-boot-patterns
description: Spring Boot best practices — project structure, controller/service/repository layers, DTOs, exception handling, configuration, and testing patterns. Use when user says "create controller", "add service", "Spring Boot help", "REST API structure", "how to handle exceptions in Spring", "configure properties", or when setting up a new Spring Boot project.
---

# Spring Boot Patterns Skill

Production-ready patterns for Spring Boot 3.x applications.

## When to Use
- Creating or reviewing controllers, services, repositories
- Setting up REST API structure and exception handling
- Configuring Spring Boot properties and profiles
- Writing Spring slice tests

---

<rules>
- Constructor injection only — no `@Autowired` on fields; all injected fields must be `final`.
- Never expose JPA entities directly in API responses — always map to DTOs.
- Never use `spring.jpa.hibernate.ddl-auto=create` or `create-drop` in production config.
- Secrets via environment variables only — never hardcoded in `application.yml`.
- `@Transactional` only on `public` service methods — Spring proxies cannot intercept `private`.
- Always annotate request bodies with `@Valid`; handle `MethodArgumentNotValidException` in the global handler.
</rules>

---

<workflow>

## Project Structure

```
src/main/java/com/example/app/
├── {feature}/
│   ├── {Feature}Controller.java      # HTTP layer
│   ├── {Feature}Service.java         # Interface
│   ├── {Feature}ServiceImpl.java     # Business logic
│   ├── {Feature}Repository.java      # Data access
│   ├── {Feature}.java                # JPA entity
│   └── dto/
│       ├── Create{Feature}Request.java
│       └── {Feature}Response.java
├── config/                           # @Configuration classes
├── exception/
│   ├── GlobalExceptionHandler.java   # @RestControllerAdvice
│   └── ResourceNotFoundException.java
└── {AppName}Application.java
```

---

## Controller Pattern

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(
            @Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

---

## DTO Pattern

Use Java records for immutable DTOs:

```java
// Request with Bean Validation
public record CreateUserRequest(
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100)
    String name,

    @NotBlank
    @Email(message = "Invalid email format")
    String email,

    @NotNull @Min(18)
    Integer age
) {}

// Response — never the JPA entity
public record UserResponse(
    Long id,
    String name,
    String email,
    LocalDateTime createdAt
) {}
```

**Mapper — use MapStruct:**

```java
@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toResponse(User entity);
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    User toEntity(CreateUserRequest request);
}
```

---

## Service Pattern

```java
public interface UserService {
    UserResponse findById(Long id);
    UserResponse create(CreateUserRequest request);
}

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    public UserResponse findById(Long id) {
        return userRepository.findById(id)
            .map(userMapper::toResponse)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    @Override
    @Transactional
    public UserResponse create(CreateUserRequest request) {
        User user = userMapper.toEntity(request);
        return userMapper.toResponse(userRepository.save(user));
    }
}
```

---

## Repository Pattern

```java
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.createdAt >= :date")
    List<User> findRecentUsers(@Param("date") LocalDate date);

    boolean existsByEmail(String email);          // ✅ not findBy for existence
    long countByActiveTrue();
}
```

---

## Global Exception Handler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setType(URI.create("/errors/not-found"));
        return ResponseEntity.of(pd).build();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .toList();
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, errors.toString());
        pd.setType(URI.create("/errors/validation"));
        return ResponseEntity.of(pd).build();
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGeneric(Exception ex) {
        log.error("Unexpected error", ex);
        var pd = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred");
        return ResponseEntity.of(pd).build();
    }
}
```

---

## Configuration Pattern

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: ${DB_USER}          # ✅ env var
    password: ${DB_PASSWORD}      # ✅ env var
  jpa:
    hibernate:
      ddl-auto: validate          # ✅ NEVER 'create' in production
    show-sql: false               # ✅ off in production

app:
  jwt:
    secret: ${JWT_SECRET}
    expiration-ms: 86400000
```

```java
@Configuration
@ConfigurationProperties(prefix = "app.jwt")
@Validated
public class JwtProperties {
    @NotBlank private String secret;
    @Min(60000) private long expirationMs;
    // getters/setters
}
```

---

## Testing Patterns

```java
// Controller slice test
@WebMvcTest(UserController.class)
class UserControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean UserService userService;

    @Test
    void shouldReturnUser() throws Exception {
        when(userService.findById(1L))
            .thenReturn(new UserResponse(1L, "John", "john@example.com", null));

        mockMvc.perform(get("/api/v1/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("John"));
    }
}

// Service unit test
@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {
    @Mock UserRepository userRepository;
    @Mock UserMapper userMapper;
    @InjectMocks UserServiceImpl userService;

    @Test
    void shouldThrowWhenUserNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.findById(1L))
            .isInstanceOf(ResourceNotFoundException.class);
    }
}

// Integration test with Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class UserIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");
    @Autowired MockMvc mockMvc;

    @Test
    void shouldCreateUser() throws Exception {
        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"John","email":"john@example.com","age":25}
                    """))
            .andExpect(status().isCreated());
    }
}
```

---

## Common Annotations Quick Reference

| Annotation | Layer | Purpose |
|------------|-------|---------|
| `@RestController` | Controller | HTTP handling |
| `@Valid` | Controller | Trigger Bean Validation |
| `@Service` | Service | Business logic |
| `@Transactional(readOnly=true)` | Service | Default for reads |
| `@Transactional` | Service | Writes and mutations |
| `@Repository` | Repository | Data access |
| `@RestControllerAdvice` | Exception | Global error handling |
| `@ConfigurationProperties` | Config | Type-safe properties |
| `@RequiredArgsConstructor` | Any | Lombok constructor injection |
</workflow>