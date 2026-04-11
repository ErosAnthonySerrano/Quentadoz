# SPEC-07: Theme Toggle
## Quentadoz — Feature Specification

---

## Overview

Quentadoz supports light and dark mode. The toggle is a persistent UI control in the navigation bar. The selected theme is saved to `localStorage` and applied immediately on page load to prevent flash.

---

## Toggle Placement

- The theme toggle is a sun/moon icon button in the main navigation bar
- On desktop: sits between the History nav item and the user icon
- On mobile: included in the bottom navigation bar

---

## Implementation

### Theme Application

- Theme is applied by setting `data-theme="dark"` or `data-theme="light"` on the `<html>` element
- All CSS color tokens in `globals.css` respond to the `[data-theme="dark"]` selector
- Dark mode uses dark gray backgrounds — never pure black (`#000000`)
- Dark mode background minimum: `#1c1c1a`

### Persistence

- Save theme preference to `localStorage` key: `quentadoz-theme`
- On app load, read this key before React hydration to set the attribute immediately
- This prevents a flash of wrong theme on page reload

### Anti-Flash Script Tag

Add an inline script in the `<head>` of `layout.tsx` **before any stylesheets** that reads `localStorage` and sets `data-theme` on `<html>` before React renders:

```html
<script dangerouslySetInnerHTML={{
  __html: `
    const t = localStorage.getItem('quentadoz-theme') || 'light';
    document.documentElement.setAttribute('data-theme', t);
  `
}} />
```

> **Note:** This must be a plain synchronous script tag, not a React component, to run before hydration.

### Zustand Store

- Create a `useThemeStore` with: `theme: 'light' | 'dark'` and `toggleTheme: () => void`
- `toggleTheme` sets state, updates `data-theme` on `document.documentElement`, and saves to `localStorage`
- On store initialization, read `localStorage` to hydrate the initial state

---

## Dark Mode Color Rules

- Never use pure black — minimum dark background is `#1c1c1a`
- Card backgrounds in dark mode: `#2a2a28`
- Surface / hover backgrounds: `#323230`
- All accent and status colors must be lightened in dark mode for sufficient contrast
- All text must meet WCAG AA contrast ratio (4.5:1 for body, 3:1 for large text)

---

## Transition

- Add a CSS transition to smooth the theme switch: `transition: background-color 0.2s, color 0.2s` on `body` and key containers
- Do not transition on page load (only after first user interaction) to avoid jank
