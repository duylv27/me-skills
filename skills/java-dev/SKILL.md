---
name: java-dev
description: >
  Use this skill whenever a developer is writing, reviewing, or refactoring Java code
  as part of an SDLC implementation phase. Triggers include: "implement this feature",
  "write the Java code for", "review my implementation", "best practices for Java",
  "how should I structure this service", "add resilience to this call", "circuit breaker",
  "retry logic", "integration with external API", "exception handling", "logging", or any
  request to produce production-quality Java code. Always use for Java implementation tasks
  that involve external integrations, service layers, or domain logic.
---
 
# Java Implementation Skill
 
Guide developers to write clean, resilient, production-grade Java code that is easy
to test and maintain. Covers coding best practices, integration resilience patterns,
and pre-PR review checklist.
 
## ⚠️ Core Principle: Don't Over-Engineer
 
> Write the simplest code that correctly solves the problem at hand.
> Add complexity only when there is a **concrete, present need** — not a hypothetical future one.
 
**Do NOT introduce unless strictly required:**
- Design patterns (Factory, Strategy, Builder) — only add when duplication or untestability
  is already a real problem, not to "prepare for future flexibility"
- Extra interfaces for classes with a single implementation and no mocking need
- Abstract base classes for two classes that happen to share a field
- Splitting a clear 20-line method into three 7-line methods with no gain in readability
- Generic utility frameworks when a plain private method does the job
- Pre-emptive layers, adapters, or wrappers for requirements that don't exist yet
**The test:** if you removed the abstraction tomorrow, would anything be harder to change
or test? If no — don't add it.
 
---
 
## Part 1 — Java Coding Best Practices
 
### Design Principles
- **SOLID**: Single responsibility per class and method; depend on abstractions, not concretions
- **DRY**: Extract repeated logic; never copy-paste business rules
- **Fail fast**: Validate inputs at the boundary; throw early with a clear message
- **Immutability by default**: Prefer `final` fields, `record` types, and unmodifiable collections
### Naming
- Class names: `PascalCase` nouns — `OrderService`, `PaymentGatewayClient`
- Method names: `camelCase` verbs — `findById`, `processPayment`, `validateRequest`
- No abbreviations; no `data`, `info`, `obj`, `temp`, `util` in domain code
- Constants: `UPPER_SNAKE_CASE`
### Code Formatting
#### Method Signatures
When a method has multiple parameters, place each parameter on its own line with consistent indentation:
```java
// ✅ Preferred: parameters on separate lines
public List<String> performBulkLink(
   long companyId,
   long groupId,
   String richMenuId,
   List<String> userIds,
   Map<String, String> currentMenuByUser
) {
   // method body
}

// ❌ Avoid: parameters aligned to opening parenthesis
public List<String> performBulkLink(long companyId,
                                    long groupId,
                                    String richMenuId,
                                    List<String> userIds,
                                    Map<String, String> currentMenuByUser) {
   // method body
}
```
### Methods
- Keep methods under **20 lines**; extract private helpers freely
- One level of abstraction per method
- Max **3 parameters**; use a value object / builder for more
- Return `Optional<T>` instead of `null` for optional results
- Use `Objects.requireNonNull(param, "param must not be null")` at the top of public methods
### Null Safety
```java
// Prefer
Optional<Order> findOrder(String id) { ... }
order.ifPresent(o -> process(o));
 
// Over
Order findOrder(String id) { return null; }  // ❌
```
 
### Collections
- Always use the interface type: `List<>`, `Map<>`, `Set<>` — never the concrete type in signatures
- Use `List.of(...)`, `Map.of(...)` for immutable collections
- Never return `null` from a collection method — return an empty collection
### Resource Management
```java
// Always use try-with-resources
try (var conn = dataSource.getConnection();
     var stmt = conn.prepareStatement(sql)) {
    // ...
}
```
 
### Exception Handling
- Catch **specific** exceptions — never bare `catch (Exception e)` or `catch (Throwable t)`
- Always log the original exception before re-throwing: `log.error("Failed to process order {}", id, e)`
- Wrap third-party exceptions in domain exceptions at service boundaries
- Use runtime exceptions in domain logic; avoid checked exceptions crossing layer boundaries
- Return structured errors from REST APIs (RFC 7807 Problem Details):
```java
@ExceptionHandler(OrderNotFoundException.class)
ResponseEntity<ProblemDetail> handleNotFound(OrderNotFoundException ex) {
    var pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    pd.setType(URI.create("/errors/order-not-found"));
    return ResponseEntity.of(pd).build();
}
```
 
### Logging
| Level | When to use |
|---|---|
| `TRACE` | Extremely fine-grained, loop internals |
| `DEBUG` | Dev/test noise, variable values |
| `INFO`  | Business events: order created, payment processed |
| `WARN`  | Recoverable issues: retry triggered, fallback used |
| `ERROR` | Failures requiring attention: integration down, data corrupt |
 
- Always log with **structured parameters**, never string concatenation:
  `log.info("Order {} transitioned to {}", orderId, newStatus)`  ✅
  `log.info("Order " + orderId + " transitioned to " + newStatus)`  ❌
- Include `traceId` and `spanId` in MDC for distributed tracing
---
 
## Part 2 — Integration Resilience
 
Use **Resilience4j** with Spring Boot for all external integrations (HTTP, gRPC, DB, queue).
 
### Dependency
```xml
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot3</artifactId>
</dependency>
```
 
### Pattern Reference
 
#### Circuit Breaker
Prevents cascade failure when a dependency is consistently failing.
```java
@CircuitBreaker(name = "paymentGateway", fallbackMethod = "paymentFallback")
public PaymentResult charge(ChargeRequest request) {
    return paymentClient.charge(request);
}
 
private PaymentResult paymentFallback(ChargeRequest request, Throwable ex) {
    log.warn("Circuit open for paymentGateway, using fallback", ex);
    return PaymentResult.pending(request.orderId());
}
```
Config (`application.yml`):
```yaml
resilience4j.circuitbreaker.instances.paymentGateway:
  slidingWindowSize: 10
  failureRateThreshold: 50
  waitDurationInOpenState: 30s
  permittedNumberOfCallsInHalfOpenState: 3
```
 
#### Retry with Exponential Back-off
Only retry **idempotent** operations. Always add jitter.
```java
@Retry(name = "inventoryService")
public InventoryStatus checkStock(String sku) {
    return inventoryClient.getStock(sku);
}
```
Config:
```yaml
resilience4j.retry.instances.inventoryService:
  maxAttempts: 3
  waitDuration: 500ms
  enableExponentialBackoff: true
  exponentialBackoffMultiplier: 2
  retryExceptions:
    - java.io.IOException
    - org.springframework.web.client.ResourceAccessException
```
 
#### Timeout
Never rely on library defaults — always set explicit connect and read timeouts.
```java
// RestClient / WebClient
RestClient.builder()
    .requestFactory(clientHttpRequestFactory())
    .build();
 
ClientHttpRequestFactory clientHttpRequestFactory() {
    var factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(Duration.ofSeconds(2));
    factory.setReadTimeout(Duration.ofSeconds(5));
    return factory;
}
```
 
#### Bulkhead
Isolate thread pools per integration to prevent one slow dependency from starving others.
```java
@Bulkhead(name = "emailService", type = Bulkhead.Type.THREADPOOL)
public CompletableFuture<Void> sendEmail(EmailRequest request) {
    return CompletableFuture.runAsync(() -> emailClient.send(request));
}
```
 
#### Idempotency Key
Pass a correlation/idempotency key on all mutating external calls so retries are safe.
```java
public PaymentResult charge(ChargeRequest request) {
    return paymentClient.charge(request.withIdempotencyKey(
        UUID.nameUUIDFromBytes(request.orderId().getBytes()).toString()
    ));
}
```
 
### Combining Patterns
Apply in this order (outermost → innermost):
```
Bulkhead → CircuitBreaker → Retry → Timeout → actual call
```
 
```java
@Bulkhead(name = "paymentGateway")
@CircuitBreaker(name = "paymentGateway", fallbackMethod = "paymentFallback")
@Retry(name = "paymentGateway")
public PaymentResult charge(ChargeRequest request) { ... }
```
 
---
 
## Part 3 — Pre-PR Checklist
 
Before raising a pull request, verify every item:
 
### Code Quality
- [ ] No hardcoded secrets, credentials, or environment-specific URLs
- [ ] No `System.out.println` or leftover debug statements
- [ ] Every public method has a Javadoc or is self-documenting
- [ ] Linting passes: Checkstyle, SpotBugs, SonarQube quality gate
### Safety
- [ ] No raw `Exception` or `Throwable` catches
- [ ] No unbounded collections or streams that could OOM under load
- [ ] Thread safety: shared state only via `synchronized`, `Atomic*`, or `java.util.concurrent` types
- [ ] No exceptions used for control flow
### Resilience
- [ ] Every external call has a timeout set
- [ ] Retry is only applied to idempotent operations
- [ ] Circuit breaker fallback returns a safe default, not another exception
- [ ] Idempotency key set on all mutating external calls
### Observability
- [ ] INFO log on every meaningful business event
- [ ] ERROR log (with exception) on every failure path
- [ ] `traceId` in MDC for all log statements in a request scope
- [ ] Actuator health indicator added for new integrations
---
 
## Output Format
 
When producing implementation code, always structure output as:
 
```
## Implementation Plan
[Brief description of approach, classes to create/modify]
 
## Code
[Fully compilable Java code with imports]
 
## Configuration
[application.yml snippets if Resilience4j or properties are needed]
 
## Pre-PR Checklist
[Completed checklist with any ❌ items flagged for follow-up]
```

---

name: java-springboot
description: 'Get best practices for developing applications with Spring Boot.'
---

# Spring Boot Best Practices

Your goal is to help me write high-quality Spring Boot applications by following established best practices.

## Project Setup & Structure

- **Build Tool:** Use Maven (`pom.xml`) or Gradle (`build.gradle`) for dependency management.
- **Starters:** Use Spring Boot starters (e.g., `spring-boot-starter-web`, `spring-boot-starter-data-jpa`) to simplify dependency management.
- **Package Structure:** Organize code by feature/domain (e.g., `com.example.app.order`, `com.example.app.user`) rather than by layer (e.g., `com.example.app.controller`, `com.example.app.service`).

## Dependency Injection & Components

- **Constructor Injection:** Always use constructor-based injection for required dependencies. This makes components easier to test and dependencies explicit.
- **Immutability:** Declare dependency fields as `private final`.
- **Component Stereotypes:** Use `@Component`, `@Service`, `@Repository`, and `@Controller`/`@RestController` annotations appropriately to define beans.

## Configuration

- **Externalized Configuration:** Use `application.yml` (or `application.properties`) for configuration. YAML is often preferred for its readability and hierarchical structure.
- **Type-Safe Properties:** Use `@ConfigurationProperties` to bind configuration to strongly-typed Java objects.
- **Profiles:** Use Spring Profiles (`application-dev.yml`, `application-prod.yml`) to manage environment-specific configurations.
- **Secrets Management:** Do not hardcode secrets. Use environment variables, or a dedicated secret management tool like HashiCorp Vault or AWS Secrets Manager.

## Web Layer (Controllers)

- **RESTful APIs:** Design clear and consistent RESTful endpoints.
- **DTOs (Data Transfer Objects):** Use DTOs to expose and consume data in the API layer. Do not expose JPA entities directly to the client.
- **Validation:** Use Java Bean Validation (JSR 380) with annotations (`@Valid`, `@NotNull`, `@Size`) on DTOs to validate request payloads.
- **Error Handling:** Implement a global exception handler using `@ControllerAdvice` and `@ExceptionHandler` to provide consistent error responses.

## Service Layer

- **Business Logic:** Encapsulate all business logic within `@Service` classes.
- **Statelessness:** Services should be stateless.
- **Transaction Management:** Use `@Transactional` on service methods to manage database transactions declaratively. Apply it at the most granular level necessary.

## Data Layer (Repositories)

- **Spring Data JPA:** Use Spring Data JPA repositories by extending `JpaRepository` or `CrudRepository` for standard database operations.
- **Custom Queries:** For complex queries, use `@Query` or the JPA Criteria API.
- **Projections:** Use DTO projections to fetch only the necessary data from the database.

## Logging

- **SLF4J:** Use the SLF4J API for logging.
- **Logger Declaration:** `private static final Logger logger = LoggerFactory.getLogger(MyClass.class);`
- **Parameterized Logging:** Use parameterized messages (`logger.info("Processing user {}...", userId);`) instead of string concatenation to improve performance.

## Testing

- **Unit Tests:** Write unit tests for services and components using JUnit 5 and a mocking framework like Mockito.
- **Integration Tests:** Use `@SpringBootTest` for integration tests that load the Spring application context.
- **Test Slices:** Use test slice annotations like `@WebMvcTest` (for controllers) or `@DataJpaTest` (for repositories) to test specific parts of the application in isolation.
- **Testcontainers:** Consider using Testcontainers for reliable integration tests with real databases, message brokers, etc.

## Security

- **Spring Security:** Use Spring Security for authentication and authorization.
- **Password Encoding:** Always encode passwords using a strong hashing algorithm like BCrypt.
- **Input Sanitization:** Prevent SQL injection by using Spring Data JPA or parameterized queries. Prevent Cross-Site Scripting (XSS) by properly encoding output.