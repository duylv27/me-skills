---
name: design-patterns
description: Common Java design patterns — when to apply them, how to implement them, and when NOT to use them. Use when user says "use factory pattern", "implement strategy", "what pattern fits here", "apply observer", "decorator pattern", or when discussing object creation, behavior, or structural design choices.
---

# Design Patterns Skill

Apply patterns to solve **concrete, present problems** — not to demonstrate pattern knowledge.

## When to Use
- Object creation is complex or conditional → Factory / Builder
- Algorithm needs to vary independently of the client → Strategy
- Reacting to state changes across multiple components → Observer
- Adding behaviour without modifying a class → Decorator
- Integrating incompatible interfaces → Adapter

---

<rules>
- **Patterns are solutions to recurring problems, not architectural decorations.** Only introduce a pattern when the problem it solves already exists in the code.
- **Name the problem before naming the pattern.** If you can't state the problem in one sentence, don't apply the pattern.
- **YAGNI applies.** "We might need multiple implementations later" is not a reason. Apply OCP/Strategy when the second implementation actually arrives.
- **Prefer the simplest solution.** A private method often replaces a Template Method. A lambda often replaces a Strategy class.
</rules>

---

<workflow>

## Pattern Selection Guide

| Situation | Pattern | Java shortcut |
|-----------|---------|---------------|
| Object creation is complex | Builder | Lombok `@Builder` |
| Choose object type at runtime | Factory Method | `switch` expression + sealed types |
| Swap algorithm at runtime | Strategy | `Function<T,R>` / lambda |
| React to state changes | Observer | Spring `ApplicationEvent` |
| Add behaviour without inheritance | Decorator | Wrap + delegate |
| Bridge incompatible interfaces | Adapter | Wrap legacy in a new interface |
| Common algorithm, varying steps | Template Method | Abstract class |
| One instance, app-wide | Singleton | Spring `@Bean` (scope=singleton) |

---

## Creational Patterns

### Builder

**Use when:** Object construction has many optional parameters, or the combination rules are complex.

```java
// ✅ Lombok @Builder — prefer this over hand-rolled builders
@Builder
public class EmailMessage {
    @NonNull private final String to;
    @NonNull private final String subject;
    private final String body;
    private final List<String> cc;
    private final boolean htmlContent;
}

// Usage
EmailMessage msg = EmailMessage.builder()
    .to("user@example.com")
    .subject("Welcome!")
    .body("<h1>Hello</h1>")
    .htmlContent(true)
    .build();
```

### Factory Method

**Use when:** The type of object to create is determined at runtime.

```java
// ✅ Modern Java: sealed types + switch expression
public sealed interface PaymentProcessor
    permits StripeProcessor, PayPalProcessor, BankTransferProcessor {}

public class PaymentProcessorFactory {
    public PaymentProcessor create(String type) {
        return switch (type) {
            case "STRIPE"   -> new StripeProcessor();
            case "PAYPAL"   -> new PayPalProcessor();
            case "BANK"     -> new BankTransferProcessor();
            default -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }
}
```

---

## Behavioural Patterns

### Strategy

**Use when:** An algorithm must vary independently of the clients that use it.

```java
// ✅ Strategy via interface (or just a lambda/Function)
@FunctionalInterface
public interface DiscountStrategy {
    BigDecimal calculate(Order order);
}

// Implementations as Spring beans
@Component("percentageDiscount")
public class PercentageDiscount implements DiscountStrategy {
    public BigDecimal calculate(Order order) {
        return order.getTotal().multiply(BigDecimal.valueOf(0.10));
    }
}

// Client depends on the abstraction
@Service
public class CheckoutService {
    private final DiscountStrategy discountStrategy;

    public CheckoutService(
            @Qualifier("percentageDiscount") DiscountStrategy discountStrategy) {
        this.discountStrategy = discountStrategy;
    }
}

// Simpler: lambda when logic is trivial
DiscountStrategy tenPercent = order -> order.getTotal().multiply(BigDecimal.valueOf(0.10));
```

### Observer

**Use when:** Multiple components need to react to state changes without tight coupling.

```java
// ✅ Use Spring ApplicationEvents — no custom observer infrastructure needed
public record OrderPlacedEvent(Long orderId, String customerId) {}

@Service
public class OrderService {
    private final ApplicationEventPublisher events;

    public Order placeOrder(Order order) {
        Order saved = orderRepository.save(order);
        events.publishEvent(new OrderPlacedEvent(saved.getId(), saved.getCustomerId()));
        return saved;
    }
}

@Component
public class InventoryListener {
    @EventListener
    public void onOrderPlaced(OrderPlacedEvent event) {
        inventoryService.reserve(event.orderId());
    }
}

@Component
@Async
public class NotificationListener {
    @EventListener
    public void onOrderPlaced(OrderPlacedEvent event) {
        emailService.sendConfirmation(event.customerId());
    }
}
```

### Template Method

**Use when:** A common algorithm has fixed steps, but some steps vary by subclass.

```java
public abstract class DataImporter {

    // Template method — fixed algorithm
    public final void importData(String source) {
        List<String> raw = readData(source);      // step 1
        List<Object> parsed = parse(raw);          // step 2 — varies
        validate(parsed);                          // step 3 — varies
        save(parsed);                              // step 4
    }

    protected abstract List<Object> parse(List<String> raw);
    protected abstract void validate(List<Object> data);

    private List<String> readData(String source) { ... }
    private void save(List<Object> data) { ... }
}
```

---

## Structural Patterns

### Decorator

**Use when:** Adding behaviour to individual objects at runtime without subclassing.

```java
public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(Long id);
}

// ✅ Decorator adds caching without touching the original
public class CachingOrderRepository implements OrderRepository {
    private final OrderRepository delegate;
    private final Cache<Long, Order> cache;

    public CachingOrderRepository(OrderRepository delegate, Cache<Long, Order> cache) {
        this.delegate = delegate;
        this.cache = cache;
    }

    @Override
    public Optional<Order> findById(Long id) {
        return Optional.ofNullable(
            cache.get(id, k -> delegate.findById(k).orElse(null))
        );
    }

    @Override
    public Order save(Order order) {
        Order saved = delegate.save(order);
        cache.put(saved.getId(), saved);
        return saved;
    }
}
```

### Adapter

**Use when:** Making an incompatible third-party or legacy interface work with your domain interface.

```java
// Your domain interface
public interface PaymentGateway {
    PaymentResult charge(ChargeRequest request);
}

// Third-party SDK with a different interface
public class StripeClient {
    public StripeCharge createCharge(long amountCents, String currency, String token) { ... }
}

// ✅ Adapter bridges the two
@Component
public class StripePaymentGateway implements PaymentGateway {
    private final StripeClient stripeClient;

    @Override
    public PaymentResult charge(ChargeRequest request) {
        StripeCharge charge = stripeClient.createCharge(
            request.amountCents(), request.currency(), request.token());
        return PaymentResult.from(charge);
    }
}
```

---

## Anti-Patterns — When NOT to Apply

| Anti-Pattern | Problem | Better |
|---|---|---|
| Singleton with static state | Global mutable state; untestable | Spring `@Bean` (default singleton scope) |
| Factory for every class | Over-engineering | `new ConcreteClass()` when type is known |
| Abstract factory for one product | Complexity without benefit | Interface + single implementation |
| Observer with 10+ listeners | Spaghetti event flow | Use a dedicated event bus with clear contracts |
| Decorator chain > 3 levels | Impossible to debug | Compose behaviour directly |

---

## Output Format

```
## Pattern Recommendation: [ClassName / task]

### Problem
[One sentence: what concrete problem exists today]

### Pattern Applied
[Pattern name — why this one fits]

### Implementation
[Code snippet]

### Alternatives Considered
[Other patterns evaluated and why they were ruled out]
```
</workflow>