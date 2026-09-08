# Slack iOS PoC Phase 3: Code Blocks

This test note is designed for **Phase 3 of the iOS Slack Clipboard PoC**.
Its goal is to verify how the Slack iOS native app handles code blocks via `text/html` (specifically `<pre><code>`).

---

## Verification Instructions for Tester
1. Open this note in **Obsidian Mobile (iOS)**.
2. Run the command **"Format Convert: Copy as Slack Format"**.
3. Paste into the **Slack iOS App** message input box.
4. Check whether code blocks render as a single unified code block box or if any line fragmentation occurs.

---

## 1. Single-Line Code Block
```typescript
console.log("Hello, Slack iOS!");
```

## 2. Multi-Line Code Block with Indentation
```javascript
function calculateTotal(items) {
    let total = 0;
    for (const item of items) {
        total += item.price * item.quantity;
    }
    return total;
}
```

## 3. Plain Code Block (No Language Tag)
```
Line 1: Plain text code block
    Line 2: Indented with 4 spaces
Line 3: Final line of code block
```

## 4. Code Block with HTML/Special Characters
```html
<div class="container">
    <a href="https://obsidian.md">Obsidian & Markdown</a>
    <span>Price < $100 & Weight > 5kg</span>
</div>
```
