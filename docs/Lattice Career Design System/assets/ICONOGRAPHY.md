# Lattice icon set

Lattice uses **[Lucide](https://lucide.dev)** for iconography — a maintained, OFL-licensed Feather successor.

## How to load

### Vanilla HTML
```html
<i data-lucide="briefcase"></i>
<i data-lucide="zap"></i>
<i data-lucide="target"></i>
<script src="https://unpkg.com/lucide@latest"></script>
<script>lucide.createIcons();</script>
```

### React (in the live codebase)
```bash
npm install lucide-react
```
```jsx
import { Briefcase, Zap, AlertCircle } from "lucide-react";
<Briefcase size={20} strokeWidth={1.5} />
```

## Substitution flag

The original `ai-career-api` codebase imports **react-icons/fi** (Feather). Lucide is a 1:1 successor — same designer (Cole Bemis), same 24×24 grid, same 1.5px stroke. To migrate:

| react-icons/fi | lucide-react |
| --- | --- |
| `FiBriefcase` | `Briefcase` |
| `FiZap` | `Zap` |
| `FiAlertCircle` | `AlertCircle` |
| `FiCamera` | `Camera` |
| `FiBarChart2` | `BarChart2` |
| `FiActivity` | `Activity` |
| `FiTrendingUp` | `TrendingUp` |
| `FiSearch` | `Search` |
| `FiThumbsUp` | `ThumbsUp` |

## Stroke / size rules

| Context | Size | Stroke |
| --- | --- | --- |
| Inline with text | 16px | 1.5 |
| In buttons, status indicators | 20px | 1.5 |
| In sidebar / headers | 20px | 1.5 |
| Standalone hero icons | 32px | 1.5 |

## Color rule

Icons inherit `currentColor`. Never tint an icon a different color from its surrounding text — if a status icon needs to feel "warning yellow," recolor the *whole* component (text + icon together).

## What's *not* used

- ❌ Emoji (anywhere in the product)
- ❌ Filled / solid icon variants
- ❌ Custom-drawn SVG icons (use the Lucide library)
- ❌ Bicolor icons
- ❌ PNG icons
