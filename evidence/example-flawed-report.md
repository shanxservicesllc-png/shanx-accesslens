# AccessLens inspection report

Source: flawed.html
Mode: Local, static HTML inspection

## Findings

Total findings: 5
High priority: 3
Medium priority: 1
Review suggested: 1

> Priority is a workflow aid, not a WCAG severity rating or conformance claim.

### AL-001: Image missing alt attribute

- Priority: high
- Rule: image-alt
- Approximate location: `body > main > img`
- Why: This image has no alt attribute. Describe meaningful images; decorative images should use alt="".

**Element excerpt**

```html
<img src="garden.jpg">
```

**Copy-ready example fix**

```html
<img src="image.jpg" alt="Describe the meaningful image">
<!-- If purely decorative, use alt="" instead. -->
```

### AL-002: Link lacks a detectable accessible name

- Priority: high
- Rule: empty-link
- Approximate location: `body > main > p > a`
- Why: No readable text, detectable ARIA label, or nonempty image alt text was found for this link.

**Element excerpt**

```html
<a href="/schedule"></a>
```

**Copy-ready example fix**

```html
<a href="/destination">Descriptive destination text</a>
```

### AL-003: Form field lacks a detectable label

- Priority: high
- Rule: form-label
- Approximate location: `body > main > form > input:nth-of-type(1)`
- Why: This interactive field has no explicit, enclosing, or detectable ARIA label. Placeholder text alone is not a label.

**Element excerpt**

```html
<input id="signup" name="email" type="email" placeholder="Email address">
```

**Copy-ready example fix**

```html
<label for="signup">Descriptive field name</label>
<input id="signup" type="email">
```

### AL-004: Duplicate id attribute

- Priority: medium
- Rule: duplicate-id
- Approximate location: `body > main > form > input:nth-of-type(1)`
- Why: The id "signup" is already used by body > main > div. IDs should be unique in a document.

**Element excerpt**

```html
<input id="signup" name="email" type="email" placeholder="Email address">
```

**Copy-ready example fix**

```html
<!-- Give this element a unique id instead of "signup". -->
```

### AL-005: Heading order needs review

- Priority: review
- Rule: heading-order
- Approximate location: `body > main > h3`
- Why: Heading level jumps from h1 to h3; review the hierarchy.

**Element excerpt**

```html
<h3>Volunteer updates</h3>
```

**Copy-ready example fix**

```html
<h2>Nested section heading</h2>
```

## Boundaries

Five static HTML heuristics only. Not a WCAG conformance audit or an accessibility score. Human and assistive-technology review remain necessary.

Suggestions are illustrative. Verify semantics, meaning and context before applying. Original input was never modified.
