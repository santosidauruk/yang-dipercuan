'use client'

import { useMemo, useState } from 'react'
import { Plus, CalendarArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import { CsvActions } from '@/components/common/CsvActions'
import {
  serializePurchases,
  parsePurchases,
  CsvImportError
} from '@/lib/csv-purchases'
import { todayISO } from '@/lib/date'
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
  const [editingData, setEditingData] = useState<Purchase | undefined>(
    undefined
  )
  const [filterCodes, setFilterCodes] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>('date-desc')
  const [pendingEditPurchase, setPendingEditPurchase] = useState<{
    id: string
    values: PurchaseFormValues
  } | null>(null)
  const [draft, setDraft] = useState<PurchaseFormValues | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Purchase | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

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
  const handleImport = (text: string) => {
    try {
      const parsed = parsePurchases(text)
      parsed.forEach((p) => addPurchase(p))
      toast.success(`${parsed.length} purchases imported`)
    } catch (e) {
      if (e instanceof CsvImportError) {
        setImportError(e.message)
      } else {
        setImportError('Could not parse CSV')
      }
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Purchases</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Buy records refresh with live prices.
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-primary text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CsvActions
          filename={`purchases-${todayISO()}.csv`}
          buildCsv={() => serializePurchases(purchases, { prices })}
          onImport={handleImport}
          importLabel="Import CSV"
          exportLabel="Export CSV"
          className="contents [&_button]:h-11 [&_button]:rounded-lg"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Button
          variant={filterCodes.length === 0 ? 'default' : 'outline'}
          size="sm"
          className="rounded-full px-4"
          onClick={() => setFilterCodes([])}
        >
          All
        </Button>
        {uniqueCodes.map((code) => (
          <Button
            key={code}
            variant={filterCodes.includes(code) ? 'default' : 'outline'}
            size="sm"
            className="rounded-full px-4"
            onClick={() => setFilterCodes([code])}
          >
            {code}
          </Button>
        ))}

        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger size="sm" className="ml-auto w-32 rounded-lg">
            <CalendarArrowDown className="mr-1 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest</SelectItem>
            <SelectItem value="code-asc">Code A-Z</SelectItem>
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
          if (pendingEditPurchase)
            persistUpdate(pendingEditPurchase.id, pendingEditPurchase.values)
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

      <SoftWarnDialog
        open={importError !== null}
        onOpenChange={(open) => {
          if (!open) setImportError(null)
        }}
        title="Import failed"
        description={
          importError ? <p>{importError}. No rows imported.</p> : null
        }
        confirmLabel="OK"
        cancelLabel="Close"
        onConfirm={() => setImportError(null)}
      />
    </div>
  )
}
