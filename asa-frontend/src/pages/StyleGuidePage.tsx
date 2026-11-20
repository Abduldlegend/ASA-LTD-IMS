import { PackageOpen, Plus } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  KpiTile,
  Select,
  Skeleton,
  StatusBadge,
  STATUS_MAP,
  Textarea,
  type StatusGroup,
} from '@/components/ui'
import { formatDate, formatNaira, formatQuantity } from '@/lib/format'
import { describeInterlockStock, INTERLOCK_RATES } from '@/lib/interlock'

const swatches = [
  { name: 'Brand 400', cls: 'bg-brand-400', note: 'Acid Yellow' },
  { name: 'Brand 500', cls: 'bg-brand-500', note: 'Hover' },
  { name: 'Brand 600', cls: 'bg-brand-600', note: 'Pressed' },
  { name: 'Brand 50', cls: 'bg-brand-50 border border-border', note: 'Tint' },
  { name: 'Ink 900', cls: 'bg-ink-900', note: 'Dark Gray' },
  { name: 'Ink 800', cls: 'bg-ink-800', note: 'Raised' },
  { name: 'Ink 700', cls: 'bg-ink-700', note: 'Border on dark' },
  { name: 'Ink 500', cls: 'bg-ink-500', note: 'Muted text' },
  { name: 'Ink 200', cls: 'bg-ink-200', note: 'Border' },
  { name: 'Ink 50', cls: 'bg-ink-50 border border-border', note: 'Canvas' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl">{title}</h2>
      {children}
    </section>
  )
}

export function StyleGuidePage() {
  return (
    <div className="min-h-screen">
      <header className="bg-ink-900 px-6 py-6 text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-brand-400 text-lg font-extrabold text-ink-900">
            A
          </span>
          <div>
            <h1 className="text-xl">ASA LTD style guide</h1>
            <p className="text-sm text-ink-300">Tokens and components used across the system</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-12 px-6 py-10">
        <Section title="Colour">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {swatches.map((s) => (
              <div key={s.name}>
                <div className={`h-14 rounded-md ${s.cls}`} />
                <p className="mt-1.5 text-sm font-medium">{s.name}</p>
                <p className="text-xs text-text-muted">{s.note}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-text-muted">
            Yellow is only a fill behind dark text, or an accent on a dark surface. It is never used as text on a
            light background.
          </p>
        </Section>

        <Section title="Typography">
          <Card className="space-y-2 p-5">
            <h1 className="text-3xl">Page title, 30px</h1>
            <h2 className="text-2xl">Section title, 24px</h2>
            <h3 className="text-xl">Card title, 20px</h3>
            <p>Body text at 15px keeps tables and forms comfortable to read all day.</p>
            <p className="text-sm text-text-muted">Secondary text at 13px for hints and descriptions.</p>
            <p className="num text-lg">
              Figures line up in columns: {formatNaira(1250000)} · {formatNaira(48250.5)} · {formatNaira(900)}
            </p>
          </Card>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <Plus className="size-4" aria-hidden />
              New sale
            </Button>
            <Button variant="secondary">Record production</Button>
            <Button variant="outline">Export</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="danger">Delete record</Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </Section>

        <Section title="Form fields">
          <Card className="grid gap-5 p-5 sm:grid-cols-2">
            <Input label="Customer name" placeholder="e.g. Musa Contractors" required />
            <Input label="Phone number" placeholder="0803 000 0000" hint="We search customers by this number" />
            <Select
              label="Payment method"
              placeholder="Choose a method"
              defaultValue=""
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'transfer', label: 'Bank transfer' },
                { value: 'pos', label: 'POS' },
              ]}
            />
            <Input label="Amount paid" type="number" defaultValue="-5" error="Amount must be greater than zero" />
            <Input label="Disabled field" defaultValue="Locked" disabled />
            <Textarea label="Notes" placeholder="Anything the next person should know" />
          </Card>
        </Section>

        <Section title="Status indicators">
          <Card className="space-y-4 p-5">
            {(Object.keys(STATUS_MAP) as StatusGroup[]).map((group) => (
              <div key={group} className="flex flex-wrap items-center gap-2">
                <span className="w-24 text-sm text-text-muted capitalize">{group}</span>
                {Object.keys(STATUS_MAP[group]).map((status) => (
                  <StatusBadge key={status} group={group} status={status} />
                ))}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-24 text-sm text-text-muted">Highlight</span>
              <Badge tone="brand">New</Badge>
            </div>
          </Card>
        </Section>

        <Section title="Cards and key figures">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiTile emphasis label="Estimated profit" value={formatNaira(3_480_000)} note="This month" />
            <KpiTile label="Total sales" value={formatNaira(8_920_500)} note="This month" />
            <KpiTile label="Outstanding from customers" value={formatNaira(1_245_000)} note="14 customers" />
          </div>
          <Card>
            <CardHeader
              title="Stock on hand"
              description="Interlocks are stocked in pieces and sold in square metres"
            />
            <dl className="divide-y divide-border text-sm">
              <div className="flex justify-between px-5 py-3">
                <dt>Double T interlocks</dt>
                <dd className="num">{describeInterlockStock(640, INTERLOCK_RATES['Double T'])}</dd>
              </div>
              <div className="flex justify-between px-5 py-3">
                <dt>I-Shape interlocks</dt>
                <dd className="num">{describeInterlockStock(1000, INTERLOCK_RATES['I-Shape'])}</dd>
              </div>
              <div className="flex justify-between px-5 py-3">
                <dt>9-inch blocks</dt>
                <dd className="num">{formatQuantity(4200, 'pcs')}</dd>
              </div>
              <div className="flex justify-between px-5 py-3">
                <dt>Cement, last truckload received</dt>
                <dd className="num">
                  {formatQuantity(600, 'bags')} · {formatDate('2026-11-18')}
                </dd>
              </div>
            </dl>
          </Card>
        </Section>

        <Section title="Loading and empty states">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="space-y-3 p-5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </Card>
            <Card>
              <EmptyState
                icon={PackageOpen}
                title="No production records yet"
                description="Record the first batch for today to start tracking curing and ready stock."
                action={<Button>Record production</Button>}
              />
            </Card>
          </div>
        </Section>
      </main>
    </div>
  )
}
