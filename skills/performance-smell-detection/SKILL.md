---
name: performance-smell-detection
description: Detect code-level performance smells in Java — streams, boxing, regex, collections, object creation, and virtual threads. Use when user says "check performance", "find slow code", "performance review", "optimize this", or when reviewing code with tight loops or large data processing. Always measure before optimizing.
---

# Performance Smell Detection Skill

Identify **potential** performance smells — not blindly "fix" them. Measure first.

## When to Use
- Reviewing performance-critical code paths
- Investigating a measured performance issue
- Code review with performance awareness

## Scope
- **This skill:** Code-level smells (streams, boxing, regex, collections, object creation)
- **For database:** Use `jpa-patterns` — N+1, lazy loading, pagination
- **For concurrency:** Use `concurrency-review`

---

<rules>
- **Measure before optimizing.** Every finding is a hypothesis. Validate with JMH, a profiler, or production metrics before changing production code.
- **Label severity honestly.** 🔴 High = nearly always worth fixing. 🟡 Medium = measure first. 🟢 Low = nice to have.
- **Prefer readability.** Don't sacrifice clarity for micro-optimizations that can't be measured.
- **Modern JVM context.** Java 9+ string concat, Java 21+ virtual threads, GraalVM — call out when the advice depends on the runtime.
</rules>

---

<workflow>

## Quick Severity Reference

| Smell | Severity | Notes |
|-------|----------|-------|
| `Pattern.compile` in loop | 🔴 High | Always worth fixing |
| String concat in loop (`+=`) | 🔴 High | Use `StringBuilder` or `String.join` |
| Unbounded collection returned from API | 🔴 High | Memory / OOM risk |
| `List.contains` in loop | 🟡 Medium | Convert to `HashSet` |
| Stream in tight loop (>100K iterations) | 🟡 Medium | Measure; may be fine |
| Boxing in hot path | 🟡 Medium | Use primitive streams |
| Parallel stream with shared mutable state | 🔴 High | Race condition risk |
| Missing collection initial capacity | 🟢 Low | Free win if size is known |
| External API/HTTP call inside `@Transactional` | 🔴 High | Holds DB connection during network I/O; can't roll back remote call |

---

## String Operations

Since **Java 9** (JEP 280), simple `+` concatenation uses `invokedynamic` — the JVM optimizes it. **Don't reflexively replace it with StringBuilder.**

```java
// ✅ Fine in Java 9+ — JVM handles this
String msg = "User " + name + " logged in at " + timestamp;

// 🔴 Still broken — O(n²) — new String object each iteration
String result = "";
for (String s : items) {
    result += s;
}

// ✅ Fix: StringBuilder for loops
StringBuilder sb = new StringBuilder();
for (String s : items) { sb.append(s); }
String result = sb.toString();

// ✅ Or: String.join / Collectors.joining
String result = String.join("", items);

// 🟡 String.format has parsing overhead in hot paths
log.debug(String.format("Processing %s with id %d", name, id));

// ✅ SLF4J parameterized logging (lazy evaluation, zero cost if DEBUG off)
log.debug("Processing {} with id {}", name, id);
```

---

## Regex

Pre-compilation is **always** worth it when the pattern is used more than once.

```java
// 🔴 Pattern.compile on every call
for (String input : inputs) {
    if (input.matches("\\d{3}-\\d{4}")) { ... }  // compiles regex each time!
}

// ✅ Pre-compile as a constant
private static final Pattern PHONE = Pattern.compile("\\d{3}-\\d{4}");

for (String input : inputs) {
    if (PHONE.matcher(input).matches()) { ... }
}
```

---

## Collections

```java
// 🟡 O(n) lookup inside a loop → O(n²) total
List<String> allowed = getAllowed();
for (Request r : requests) {
    if (allowed.contains(r.getId())) { ... }
}

// ✅ Convert to Set first → O(1) lookup
Set<String> allowed = new HashSet<>(getAllowed());
for (Request r : requests) {
    if (allowed.contains(r.getId())) { ... }
}

// 🔴 Unbounded query — millions of rows → OOM
@GetMapping("/orders")
public List<Order> getAll() {
    return orderRepository.findAll();  // ❌
}

// ✅ Paginate
@GetMapping("/orders")
public Page<Order> getAll(Pageable pageable) {
    return orderRepository.findAll(pageable);
}

// 🟢 Capacity hint — free win when size is known
List<User> users = new ArrayList<>(expectedSize);
Map<String, User> map = new HashMap<>(expectedSize * 4 / 3 + 1);
```

---

## Streams

Streams have overhead, but it's often acceptable:
- **< 1K items**: Streams can be 2–5x slower, but still microseconds — readability wins
- **> 10K items**: Within 50% of a loop
- **GraalVM**: Can optimize streams to match loops

```java
// 🟡 Stream created per iteration in a tight loop
for (int i = 0; i < 1_000_000; i++) {
    boolean found = items.stream().anyMatch(item -> item.getId() == i);
}

// ✅ Pre-compute a lookup structure
Set<Integer> itemIds = items.stream().map(Item::getId).collect(Collectors.toSet());
for (int i = 0; i < 1_000_000; i++) {
    boolean found = itemIds.contains(i);
}

// ✅ Use primitive streams to avoid boxing
int sum = numbers.stream().mapToInt(Integer::intValue).sum();

// 🔴 Parallel stream with shared mutable state → race condition
List<String> results = new ArrayList<>();
items.parallelStream().forEach(results::add);  // ❌

// ✅ Parallel only for CPU-intensive + large collections; always use collectors
List<Result> results = largeDataset.parallelStream()
    .map(this::expensiveCpuWork)
    .collect(Collectors.toList());
```

---

## Boxing in Hot Paths

JVM caches Integer/Long -128 to 127; larger values allocate on heap.

```java
// 🟡 Boxing in tight loop — creates millions of objects
Long sum = 0L;
for (int i = 0; i < 1_000_000; i++) {
    sum += i;  // unbox → add → box
}

// ✅ Use primitive
long sum = 0L;
for (int i = 0; i < 1_000_000; i++) {
    sum += i;
}
```

---

## Virtual Threads (Java 21+)

Virtual threads are ideal for I/O-bound work — not CPU-bound.

```java
// 🟡 Traditional thread pool wastes OS threads on blocking I/O
ExecutorService executor = Executors.newFixedThreadPool(100);
executor.submit(() -> callExternalApi(request));  // blocks OS thread

// ✅ Virtual threads handle millions of concurrent I/O tasks
try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (Request request : requests) {
        executor.submit(() -> callExternalApi(request));
    }
}

// ❌ Virtual threads give no benefit for CPU-bound work
// Use ForkJoinPool or platform threads for CPU-intensive computation
```

---

## External I/O Inside `@Transactional`

Calling an external API or sending a message broker event **inside a Spring `@Transactional` method** is a 🔴 High severity smell with two distinct problems:

1. **Connection leak / pool starvation** — the DB connection is held open for the entire duration of the network call. Under load this exhausts the connection pool.
2. **Non-atomicity** — the external call cannot be rolled back if the transaction later fails. You get a half-committed state (e.g., payment charged but order not saved).

```java
// 🔴 External HTTP call inside transaction — holds DB connection during network wait
@Transactional
public void placeOrder(Order order) {
    orderRepository.save(order);
    paymentClient.charge(order);   // ❌ blocks DB connection for network round-trip
    inventoryClient.reserve(order); // ❌ second external call, still inside transaction
}

// ✅ Fix 1 — move external calls outside the transaction
public void placeOrder(Order order) {
    saveOrder(order);              // @Transactional boundary ends here
    paymentClient.charge(order);   // ✅ no DB connection held
    inventoryClient.reserve(order);
}

@Transactional
private void saveOrder(Order order) {
    orderRepository.save(order);
}

// ✅ Fix 2 — use Transactional Outbox pattern for guaranteed delivery
// Write an "outbox" record in the same transaction; a separate process publishes it.
@Transactional
public void placeOrder(Order order) {
    orderRepository.save(order);
    outboxRepository.save(new OutboxEvent("PAYMENT_REQUESTED", order.getId()));
    // ✅ DB connection released; outbox relay picks up and calls paymentClient
}
```

**Detection signals to look for:**
- `RestTemplate`, `WebClient`, `FeignClient`, `HttpClient` calls inside a `@Transactional` method
- Kafka/RabbitMQ producer `.send()` inside `@Transactional` (message sent even if TX rolls back)
- `@Async` service calls that trigger their own transactions but parent still holds a connection

**Measurement:** Correlate DB connection wait time in your connection pool metrics (HikariCP `pool.Wait`) with external service p99 latency. If they track together, you have this smell.

---

## Review Output Format

```
## Performance Review: [ClassName / method]

### 🔴 High Severity (fix now)
- [Smell + line reference + fix]

### 🟡 Medium Severity (measure first)
- [Smell + why it may matter + how to measure]

### 🟢 Low Severity (nice to have)
- [Optional improvement]

### Measurement Recommendation
[What to benchmark / profile to validate these findings]
```
</workflow>