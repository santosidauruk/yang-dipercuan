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
import { useStocksPrices } from '@/hooks/useStocks'
import { usePurchases } from '@/stores/usePurchases'
import { useSales } from '@/stores/useSales'
import { wouldCauseNegativeQty } from '@/lib/portfolio'
import {
  PurchaseFormDialog,
  type PurchaseFormValues
} from './PurchaseFormDialog'
import { PurchasesTable } from './PurchasesTable'
import { SoftWarnDialog } from '@/components/common/SoftWarnDialog'
import type { Purchase } from '@/types'

type SortKey = 'date-desc' | 'code-asc'

export function PurchasesPageClient() {
  const purchases = usePurchases((s) => s.purchases)
  const addPurchase = usePurchases((s) => s.addPurchase)
  const updatePurchase = usePurchases((s) => s.updatePurchase)
  const removePurchase = usePurchases((s) => s.removePurchase)
  const sales = useSales((s) => s.sales)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Purchase | undefined>(undefined)
  const [filterCodes, setFilterCodes] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('date-desc')
  const [pendingEdit, setPendingEdit] = useState<{
    id: string
    values: PurchaseFormValues
  } | null>(null)

  const uniqueCodes = useMemo(
    () => Array.from(new Set(purchases.map((p) => p.code))).sort(),
    [purchases]
  )

  const yahooSymbols = useMemo(
    () => uniqueCodes.map((c) => `${c}.JK`),
    [uniqueCodes]
  )
  const { data: prices = {} } = useStocksPrices(yahooSymbols)

  const filtered = useMemo(() => {
    const rows =
      filterCodes.length === 0
        ? purchases
        : purchases.filter((p) => filterCodes.includes(p.code))

    const sorted = [...rows].sort((a, b) => {
      if (sortKey === 'date-desc') {
        return b.date.localeCompare(a.date)
      }
      return a.code.localeCompare(b.code)
    })
    return sorted
  }, [purchases, filterCodes, sortKey])

  const openAdd = () => {
    setEditing(undefined)
    setDialogOpen(true)
  }
  const openEdit = (purchase: Purchase) => {
    setEditing(purchase)
    setDialogOpen(true)
  }
  const persistUpdate = (id: string, values: PurchaseFormValues) => {
    updatePurchase(id, values)
    toast.success(`${values.code} updated`)
  }

  const handleSubmit = (values: PurchaseFormValues) => {
    if (editing) {
      if (wouldCauseNegativeQty(purchases, sales, editing.id, values)) {
        setPendingEdit({ id: editing.id, values })
        return
      }
      persistUpdate(editing.id, values)
    } else {
      addPurchase(values)
      toast.success(`${values.code} added`)
    }
  }
  const handleDelete = (purchase: Purchase) => {
    if (
      confirm(
        `Delete purchase ${purchase.code} on ${purchase.date}? This cannot be undone.`
      )
    ) {
      removePurchase(purchase.id)
      toast.success(`${purchase.code} deleted`)
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
          <h1 className="text-2xl font-bold">Purchases</h1>
          <p className="text-muted-foreground text-sm">
            Track every buy. Last price + change refresh every 30s.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={uniqueCodes.length === 0}>
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

        <Select
          value={sortKey}
          onValueChange={(v) => setSortKey(v as SortKey)}
        >
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

      <PurchasesTable
        purchases={filtered}
        prices={prices}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <PurchaseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <SoftWarnDialog
        open={pendingEdit !== null}
        onOpenChange={(open) => {
          if (!open) setPendingEdit(null)
        }}
        title="Edit causes negative downstream quantity"
        description={
          pendingEdit
            ? `This edit would orphan a later sale of ${pendingEdit.values.code}. Continue anyway?`
            : ''
        }
        confirmLabel="Continue"
        onConfirm={() => {
          if (pendingEdit) persistUpdate(pendingEdit.id, pendingEdit.values)
        }}
      />
    </div>
  )
}
