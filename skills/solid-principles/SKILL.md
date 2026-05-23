---
name: solid-principles
description: SOLID principles for Java — detect violations and refactor toward single responsibility, open/closed, Liskov substitution, interface segregation, and dependency inversion. Use when user says "check SOLID", "single responsibility", "too many responsibilities", "refactor this class", "this class is doing too much", or when reviewing class design.
---

# SOLID Principles Skill

Identify SOLID violations and guide targeted refactoring — not wholesale rewrites.

## When to Use
- Reviewing class design or a large class
- "This class feels too big / does too much"
- Refactoring to improve testability
- Code review with design focus

---

<rules>
- **Diagnose before refactoring.** State which principle is violated and why, before proposing any change.
- **One violation at a time.** Don't chain refactors; fix the highest-priority violation first.
- **Don't introduce SOLID for its own sake.** A 20-line class with one responsibility doesn't need interfaces. Apply only when there is a concrete problem: untestability, ripple changes, or duplication.
- **YAGNI applies.** OCP extensions must be needed now, not hypothetically future.
</rules>

---

<workflow>

## Quick Reference

| Letter | Principle | One-liner | Key Smell |
|--------|-----------|-----------|-----------|
| **S** | Single Responsibility | One class = one reason to change | Class name has "And" / "Manager"; many unrelated imports |
| **O** | Open / Closed | Open for extension, closed for modification | `instanceof` chains; `if/else` on type string |
| **L** | Liskov Substitution | Subtypes must be safely substitutable for base types | Override throws exception base doesn't declare |
| **I** | Interface Segregation | Many specific interfaces > one fat interface | Callers forced to implement methods they don't use |
| **D** | Dependency Inversion | Depend on abstractions, not concretions | `new ConcreteService()` inside business logic |

---

## S — Single Responsibility Principle

> "A class should have only one reason to change."

**Violation signals:**
- Class imports span multiple domains (email, persistence, validation, auditing)
- Methods don't share fields
- You can't name the class without "And"

```java
// ❌ UserService: validates + persists + sends email + audits
public class UserService {
    public User createUser(String name, String email) {
        if (!email.contains("@")) throw new IllegalArgumentException("Bad email");
        User user = entityManager.persist(new User(name, email));
        emailClient.send(email, "Welcome!", "Hello " + name);
        auditLog.log("User created: " + email);
        return user;
    }
}

// ✅ One class per concern
public class UserService {
    private final UserValidator validator;
    private final UserRepository repository;
    private final WelcomeEmailSender emailSender;
    private final UserAuditLogger auditLogger;

    public User createUser(String name, String email) {
        validator.validate(name, email);
        User user = repository.save(new User(name, email));
        emailSender.sendWelcome(user);
        auditLogger.logCreation(user);
        return user;
    }
}
```

---

## O — Open / Closed Principle

> "Open for extension, closed for modification."

**Violation signals:** adding a new type requires editing an existing class (long `if/else` or `switch` on a type string).

```java
// ❌ Every new discount type modifies this class
public double calculate(Order order, String type) {
    if ("PERCENTAGE".equals(type)) return order.getTotal() * 0.1;
    else if ("FIXED".equals(type))  return 50.0;
    // new types → modify this class
}

// ✅ Strategy — new discount = new class, zero modifications
public interface DiscountStrategy {
    double calculate(Order order);
}

@Component
public class PercentageDiscount implements DiscountStrategy { ... }

@Component
public class FixedDiscount implements DiscountStrategy { ... }
```

---

## L — Liskov Substitution Principle

> "Subtypes must be substitutable for their base type without altering correctness."

**Violation signals:**
- Override throws an exception the base contract doesn't declare
- Override returns `null` where base guarantees non-null
- Subclass adds preconditions the base doesn't require

```java
// ❌ ReadOnlyList violates List contract
public class ReadOnlyList<T> extends ArrayList<T> {
    @Override
    public boolean add(T element) {
        throw new UnsupportedOperationException(); // breaks contract
    }
}

// ✅ Use composition or a narrower interface
public interface ReadableList<T> {
    T get(int index);
    int size();
}
```

---

## I — Interface Segregation Principle

> "Clients should not be forced to depend on methods they do not use."

**Violation signals:** implementing class throws `UnsupportedOperationException` for some methods.

```java
// ❌ Fat interface forces all implementors to handle everything
public interface Worker {
    void work();
    void eat();
    void sleep();
}

// ✅ Split by client need
public interface Workable  { void work(); }
public interface Eatable   { void eat(); }
public interface Sleepable { void sleep(); }

public class HumanWorker implements Workable, Eatable, Sleepable { ... }
public class RobotWorker  implements Workable { ... }   // no eat/sleep
```

---

## D — Dependency Inversion Principle

> "Depend on abstractions, not concretions."

**Violation signals:** `new ConcreteService()` inside business logic; hard-coded instantiation making unit testing impossible.

```java
// ❌ High-level module depends on low-level concretion
public class OrderService {
    private final MySQLOrderRepository repo = new MySQLOrderRepository(); // ❌
}

// ✅ Depend on abstraction; inject via constructor
public class OrderService {
    private final OrderRepository repo; // interface

    public OrderService(OrderRepository repo) {
        this.repo = repo;
    }
}
```

---

## Output Format

```
## SOLID Review: [ClassName]

### Violations Found
| Principle | Severity | Description |
|-----------|----------|-------------|
| SRP | High | Class handles persistence, email, and auditing |

### Recommended Refactoring
[Smallest change that fixes the violation — code snippet if helpful]

### What to Leave Alone
[Call out any sections that are fine as-is]
```
</workflow>