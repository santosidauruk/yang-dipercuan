'use client'

import { useMemo, useState } from 'react'
import { Plus, ArrowDownAZ, CalendarArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { usePurchases } from '@/stores/usePurchases'
import { useSales } from '@/stores/useSales'
import { qty } from '@/lib/portfolio'
import { SaleFormDialog, type SaleFormValues } from './SaleFormDialog'
import { SalesTable } from './SalesTable'
import { SoftWarnDialog } from '@/components/common/SoftWarnDialog'
import { CsvActions } from '@/components/common/CsvActions'
import { serializeSales, parseSales } from '@/lib/csv-sales'
import { CsvImportError } from '@/lib/csv-purchases'
import { todayISO } from '@/lib/date'
import type { Sale } from '@/types'

type SortKey = 'date-desc' | 'code-asc'

export function SalesPageClient() {
  const purchases = usePurchases((s) => s.purchases)
  const sales = useSales((s) => s.sales)
  const addSale = useSales((s) => s.addSale)
  const updateSale = useSales((s) => s.updateSale)
  const removeSale = useSales((s) => s.removeSale)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Sale | undefined>(undefined)
  const [filterCodes, setFilterCodes] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('date-desc')
  const [pendingSale, setPendingSale] = useState<{
    values: SaleFormValues
    heldLots: number
  } | null>(null)
  const [draft, setDraft] = useState<SaleFormValues | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const uniqueCodes = useMemo(
    () => Array.from(new Set(sales.map((s) => s.code))).sort(),
    [sales]
  )

  const filtered = useMemo(() => {
    const rows =
      filterCodes.length === 0
        ? sales
        : sales.filter((s) => filterCodes.includes(s.code))

    return [...rows].sort((a, b) =>
      sortKey === 'date-desc'
        ? b.date.localeCompare(a.date)
        : a.code.localeCompare(b.code)
    )
  }, [sales, filterCodes, sortKey])

  const openAdd = () => {
    setEditing(undefined)
    setDraft(null)
    setDialogOpen(true)
  }
  const openEdit = (sale: Sale) => {
    setEditing(sale)
    setDraft(null)
    setDialogOpen(true)
  }
  const handleFormOpenChange = (open: boolean) => {
    setDialogOpen(open)
    // if (!open) setDraft(null)
  }

  const persistAdd = (values: SaleFormValues) => {
    addSale(values)
    toast.success(`${values.code} sale recorded`)
  }

  const handleSubmit = (values: SaleFormValues) => {
    if (editing) {
      updateSale(editing.id, values)
      toast.success(`${values.code} updated`)
      return
    }
    const heldLots = qty(purchases, sales, values.code) / 100
    if (values.lots > heldLots) {
      setPendingSale({ values, heldLots })
      return
    }
    persistAdd(values)
  }

  const handleDelete = (sale: Sale) => {
    if (confirm(`Delete sale ${sale.code} on ${sale.date}? This cannot be undone.`)) {
      removeSale(sale.id)
      toast.success(`${sale.code} sale deleted`)
    }
  }

  const handleDeleteAll = () => {
    if (sales.length === 0) return
    if (confirm(`Delete all ${sales.length} sale records? This cannot be undone.`)) {
      sales.forEach((s) => removeSale(s.id))
      toast.success('All sales deleted')
    }
  }

  const handleImport = (text: string) => {
    try {
      const parsed = parseSales(text)
      parsed.forEach((s) => addSale(s))
      toast.success(`${parsed.length} sales imported`)
    } catch (e) {
      setImportError(
        e instanceof CsvImportError ? e.message : 'Could not parse CSV'
      )
    }
  }
  const toggleFilter = (code: string) => {
    setFilterCodes((cur) =>
      cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-muted-foreground text-sm">
            Track every sell. Cost basis auto-filled from purchase average.
          </p>
        </div>
        <div className="flex gap-2">
          {sales.length > 0 && (
            <Button variant="outline" onClick={handleDeleteAll}>
              Delete All
            </Button>
          )}
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <CsvActions
          filename={`sales-${todayISO()}.csv`}
          buildCsv={() => serializeSales(sales)}
          onImport={handleImport}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={uniqueCodes.length === 0}
            >
              <ArrowDownAZ className="h-4 w-4" />
              Filter
              {filterCodes.length > 0 && (
                <span className="ml-1 text-xs">({filterCodes.length})</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Filter by code</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {uniqueCodes.map((code) => (
              <DropdownMenuCheckboxItem
                key={code}
                checked={filterCodes.includes(code)}
                onCheckedChange={() => toggleFilter(code)}
                onSelect={(e) => e.preventDefault()}
              >
                {code}
              </DropdownMenuCheckboxItem>
            ))}
            {filterCodes.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setFilterCodes([])}
                >
                  Clear
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger size="sm" className="w-45">
            <CalendarArrowDown className="mr-1 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Date (newest first)</SelectItem>
            <SelectItem value="code-asc">Code (A→Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SalesTable sales={filtered} onEdit={openEdit} onDelete={handleDelete} />

      <SaleFormDialog
        open={dialogOpen}
        onOpenChange={handleFormOpenChange}
        initial={editing}
        draft={draft}
        purchases={purchases}
        onSubmit={handleSubmit}
      />

      <SoftWarnDialog
        open={pendingSale !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSale(null)
        }}
        title="Selling more than you hold"
        description={
          pendingSale
            ? `You're selling ${pendingSale.values.lots} lots of ${pendingSale.values.code} but only ${pendingSale.heldLots} lots held. Continue anyway?`
            : ''
        }
        confirmLabel="Continue"
        onConfirm={() => {
          if (pendingSale) persistAdd(pendingSale.values)
        }}
        onCancel={() => {
          if (pendingSale) {
            setDraft(pendingSale.values)
            setDialogOpen(true)
          }
        }}
      />

      <SoftWarnDialog
        open={importError !== null}
        onOpenChange={(open) => {
          if (!open) setImportError(null)
        }}
        title="Import failed"
        description={importError ? <p>{importError}. No rows imported.</p> : null}
        confirmLabel="OK"
        cancelLabel="Close"
        onConfirm={() => setImportError(null)}
      />
    </div>
  )
}
