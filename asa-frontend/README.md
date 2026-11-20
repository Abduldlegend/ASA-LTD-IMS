# ASA LTD frontend

React + TypeScript + Tailwind CSS v4 frontend for the ASA LTD inventory, production and financial management system.

## Scripts
- `npm run dev` start the dev server (open `/style-guide` to see the design system)
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`

## Structure
- `src/components/ui` shared primitives (Button, Input, Select, Badge, Card, KPI tile, ...)
- `src/lib` formatters (naira, dates, units) and the interlock pieces-to-m² helpers
- `src/pages`, `src/features`, `src/layouts`, `src/mocks`, `src/types`, `src/hooks` (next stages)
- Design tokens live in `src/index.css` (`@theme`)
