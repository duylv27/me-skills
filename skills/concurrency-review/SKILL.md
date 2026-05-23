---
name: concurrency-review
description: Review Java concurrency code for thread safety, race conditions, deadlocks, and modern patterns — Virtual Threads, CompletableFuture, @Async. Use when user says "check thread safety", "concurrency review", "async code review", "review multi-threaded code", "is this thread safe", or when reviewing code with synchronized, volatile, Lock, @Async, or CompletableFuture.
---

# Concurrency Review Skill

Review Java concurrent code for correctness, safety, and modern best practices.

## When to Use
- Code uses `synchronized`, `volatile`, `Lock`, `AtomicXxx`
- Code uses `@Async`, `CompletableFuture`, `ExecutorService`
- Validating thread safety of shared mutable state
- Reviewing Virtual Threads or Structured Concurrency (Java 21+)

---

<rules>
- Flag all shared mutable state. If state is shared across threads without synchronization, it is a bug — not a risk.
- Never mark `@Async` on `private` or same-class methods — Spring proxies cannot intercept them.
- Never use the default `SimpleAsyncTaskExecutor` in production — it creates an unbounded new thread per task.
- Never rely on `ThreadLocal` in virtual thread code — use `ScopedValue` (Java 21+).
- Always handle `CompletableFuture` exceptions — unhandled failures are silently swallowed.
- Always set timeouts on `CompletableFuture` chains — `orTimeout()` or `completeOnTimeout()`.
</rules>

---

<workflow>

## Review Checklist

### Security / Correctness (P1)
- [ ] Shared mutable state is guarded by `synchronized`, `Lock`, or `Atomic*`
- [ ] `volatile` used where visibility-only guarantee is needed (single writer, multiple readers)
- [ ] No check-then-act sequences without atomicity (`containsKey` → `put` → use `computeIfAbsent`)
- [ ] 64-bit `long`/`double` fields shared across threads use `volatile` or `AtomicLong`

### Spring @Async (P2)
- [ ] `@EnableAsync` present on a `@Configuration` class
- [ ] `@Async` only on `public` methods
- [ ] No `@Async` called from the same class (bypasses proxy → runs synchronously)
- [ ] Custom `ThreadPoolTaskExecutor` configured — not the default `SimpleAsyncTaskExecutor`
- [ ] `SecurityContextHolder` propagated via `DelegatingSecurityContextAsyncTaskExecutor` if security context is needed in async tasks

### CompletableFuture (P3)
- [ ] Every `CompletableFuture` chain has `.exceptionally()` or `.handle()` — no swallowed failures
- [ ] Timeouts set: `.orTimeout(5, SECONDS)` or `.completeOnTimeout(default, 5, SECONDS)`
- [ ] Blocking I/O tasks use a dedicated executor, not `ForkJoinPool.commonPool()`
- [ ] CPU-bound tasks use platform threads / `ForkJoinPool`, not virtual threads

### Virtual Threads / Modern Java (P4)
- [ ] No `ThreadLocal` in virtual thread code — use `ScopedValue` (Java 21+)
- [ ] Virtual threads used for I/O-bound tasks only, not CPU-bound
- [ ] `synchronized` blocks with blocking I/O noted (pinning risk on Java 21–23; fixed in Java 25)

---

## Key Issues with Code Examples

### Race Conditions — Check-Then-Act

```java
// ❌ Race condition: two threads may both see containsKey=false
if (!map.containsKey(key)) {
    map.put(key, computeValue());
}

// ✅ Atomic
map.computeIfAbsent(key, k -> computeValue());

// ❌ Non-atomic counter
if (count < MAX) { count++; }

// ✅ Atomic update
AtomicInteger count = new AtomicInteger();
count.updateAndGet(c -> c < MAX ? c + 1 : c);
```

### Visibility — Missing volatile

```java
// ❌ Other threads may never see running=false
private boolean running = true;
public void stop() { running = false; }
public void run()  { while (running) { } }  // may loop forever

// ✅
private volatile boolean running = true;
```

### Double-Checked Locking

```java
// ❌ Without volatile — partially constructed object may be visible
private static Singleton instance;
public static Singleton getInstance() {
    if (instance == null) {
        synchronized (Singleton.class) {
            if (instance == null) instance = new Singleton();
        }
    }
    return instance;
}

// ✅ volatile guarantees safe publication
private static volatile Singleton instance;

// ✅ Better: initialization-on-demand holder (no synchronization needed)
public class Singleton {
    private static class Holder {
        static final Singleton INSTANCE = new Singleton();
    }
    public static Singleton getInstance() { return Holder.INSTANCE; }
}

// ✅ Best for Spring apps: just use @Bean (Spring manages singleton)
```

### @Async Pitfalls

```java
// ❌ Calls async from same class — proxy bypass, runs synchronously
@Service
public class OrderService {
    public void processOrder(Order order) {
        sendConfirmation(order);  // ❌ direct call, not async
    }
    @Async
    public void sendConfirmation(Order order) { ... }
}

// ✅ Inject the async method through a separate bean
@Service @RequiredArgsConstructor
public class OrderService {
    private final EmailService emailService; // separate @Service
    public void processOrder(Order order) {
        emailService.sendConfirmation(order); // ✅ proxy call
    }
}

// ❌ Default executor — unbounded new threads
// ✅ Always configure a thread pool
@Configuration @EnableAsync
public class AsyncConfig {
    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(10);
        ex.setMaxPoolSize(50);
        ex.setQueueCapacity(100);
        ex.setThreadNamePrefix("async-");
        ex.setRejectedExecutionHandler(new CallerRunsPolicy());
        ex.initialize();
        return ex;
    }
}
```

### CompletableFuture — Error Handling and Timeouts

```java
// ❌ Exception silently swallowed
CompletableFuture.supplyAsync(() -> riskyOperation());

// ✅ Always handle exceptions
CompletableFuture.supplyAsync(() -> riskyOperation())
    .exceptionally(ex -> {
        log.error("Operation failed", ex);
        return fallbackValue;
    });

// ✅ Timeout
CompletableFuture.supplyAsync(() -> slowOperation())
    .orTimeout(5, TimeUnit.SECONDS);

// ✅ Timeout with default
CompletableFuture.supplyAsync(() -> slowOperation())
    .completeOnTimeout(defaultValue, 5, TimeUnit.SECONDS);

// ✅ Use virtual threads for I/O, not commonPool
ExecutorService ioExec = Executors.newVirtualThreadPerTaskExecutor();
CompletableFuture.supplyAsync(() -> blockingIoCall(), ioExec);
```

### Virtual Threads (Java 21+)

```java
// ✅ Perfect for I/O-bound: HTTP calls, DB queries, file I/O
try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (Request request : requests) {
        executor.submit(() -> callExternalApi(request));
    }
}

// ❌ No benefit for CPU-bound — use ForkJoinPool
// ❌ ThreadLocal problematic with virtual threads
private static final ThreadLocal<User> current = new ThreadLocal<>();

// ✅ ScopedValue (Java 21+)
private static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance();
ScopedValue.where(CURRENT_USER, user).run(() -> processRequest());
```

---

## Output Format

```
## Concurrency Review: [ClassName]

### P1 — Correctness / Safety
- [ ✅ / ❌ ] [Gate description] — [finding or OK]

### P2 — @Async
- [ ✅ / ❌ ] [Gate description]

### P3 — CompletableFuture
- [ ✅ / ❌ ] [Gate description]

### P4 — Virtual Threads
- [ ✅ / ❌ ] [Gate description]

### Critical Findings
[Any ❌ items with fix recommendation]
```
</workflow>