# Reactivate BonusHeroCard Stats

## What Was Hidden
The following stats were temporarily hidden from the GL Dashboard:
- **Jahresumsatz** (yearly revenue with percentage comparison)
- **Vorverkäufe** (pre-sales count with progress bar)
- **Vorbestellungen** (pre-orders count with progress bar)
- **Märkte besucht** (markets visited with progress bar)

## How to Reinstate

### File to Modify
`src/components/gl/BonusHeroCard.tsx`

### Change Required
On **line 15**, change:
```tsx
const SHOW_STATS = false;
```

To:
```tsx
const SHOW_STATS = true;
```

### That's It
The entire stats UI is wrapped in a `{SHOW_STATS && (...)}` conditional. Setting the flag to `true` will immediately show all the hidden stats again.

## Verification
After the change, the BonusHeroCard should display:
1. The large "Jahresumsatz" amount with percentage vs Agenturdurchschnitt
2. Three stat cards below: Vorverkäufe, Vorbestellungen, Märkte besucht
3. Each stat card has an icon, value, progress bar, and label
