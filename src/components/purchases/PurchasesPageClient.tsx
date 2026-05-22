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
import { useDividends } from '@/stores/useDividends'
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
  const dividends = useDividends((s) => s.dividends)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingData, setEditingData] = useState<Purchase | undefined>(undefined)
  const [filterCodes, setFilterCodes] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('date-desc')
  const [pendingEditPurchase, setPendingEditPurchase] = useState<{
    id: string
    values: PurchaseFormValues
  } | null>(null)
  const [draft, setDraft] = useState<PurchaseFormValues | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Purchase | null>(null)

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
    setEditingData(undefined)
    setDraft(null)
    setDialogOpen(true)
  }
  const openEdit = (purchase: Purchase) => {
    setEditingData(purchase)
    setDraft(null)
    setDialogOpen(true)
  }
  const handleFormOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) setDraft(null)
  }
  const persistUpdate = (id: string, values: PurchaseFormValues) => {
    updatePurchase(id, values)
    toast.success(`${values.code} updated`)
  }

  const handleSubmit = (values: PurchaseFormValues) => {
    if (editingData) {
      if (wouldCauseNegativeQty(purchases, sales, editingData.id, values)) {
        setPendingEditPurchase({ id: editingData.id, values })
        return
      }
      persistUpdate(editingData.id, values)
    } else {
      addPurchase(values)
      toast.success(`${values.code} added`)
    }
  }
  const handleDelete = (purchase: Purchase) => {
    setPendingDelete(purchase)
  }
  const confirmDelete = () => {
    if (!pendingDelete) return
    removePurchase(pendingDelete.id)
    toast.success(`${pendingDelete.code} deleted`)
  }
  const pendingDeleteSalesCount = pendingDelete
    ? sales.filter((s) => s.code === pendingDelete.code).length
    : 0
  const pendingDeleteDividendsCount = pendingDelete
    ? dividends.filter((d) => d.code === pendingDelete.code).length
    : 0
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
        onOpenChange={handleFormOpenChange}
        initial={editingData}
        draft={draft}
        onSubmit={handleSubmit}
      />

      <SoftWarnDialog
        open={pendingEditPurchase !== null}
        onOpenChange={(open) => {
          if (!open) setPendingEditPurchase(null)
        }}
        title="Edit causes negative downstream quantity"
        description={
          pendingEditPurchase
            ? `This edit would orphan a later sale of ${pendingEditPurchase.values.code}. Continue anyway?`
            : ''
        }
        confirmLabel="Continue"
        onConfirm={() => {
          if (pendingEditPurchase) persistUpdate(pendingEditPurchase.id, pendingEditPurchase.values)
        }}
        onCancel={() => {
          if (pendingEditPurchase) {
            setDraft(pendingEditPurchase.values)
            setDialogOpen(true)
          }
        }}
      />

      <SoftWarnDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="Delete purchase"
        description={
          pendingDelete ? (
            <>
              <p>
                Delete purchase {pendingDelete.code} on {pendingDelete.date}?
                This cannot be undone.
              </p>
              <p className="text-muted-foreground mt-2">
                This will not affect {pendingDeleteSalesCount}{' '}
                {pendingDeleteSalesCount === 1 ? 'sale' : 'sales'} and{' '}
                {pendingDeleteDividendsCount}{' '}
                {pendingDeleteDividendsCount === 1 ? 'dividend' : 'dividends'}{' '}
                for {pendingDelete.code}.
              </p>
            </>
          ) : null
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
