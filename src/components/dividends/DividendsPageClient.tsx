'use client'

import { useMemo, useState } from 'react'
import { Plus, ArrowDownAZ } from 'lucide-react'
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
import { usePurchases } from '@/stores/usePurchases'
import { useSales } from '@/stores/useSales'
import { useDividends } from '@/stores/useDividends'
import {
  DividendFormDialog,
  type DividendFormValues
} from './DividendFormDialog'
import { DividendsTable } from './DividendsTable'
import { SoftWarnDialog } from '@/components/common/SoftWarnDialog'
import { CsvActions } from '@/components/common/CsvActions'
import { serializeDividends, parseDividends } from '@/lib/csv-dividends'
import { CsvImportError } from '@/lib/csv-purchases'
import { todayISO } from '@/lib/date'
import type { Dividend } from '@/types'

export function DividendsPageClient() {
  const purchases = usePurchases((s) => s.purchases)
  const sales = useSales((s) => s.sales)
  const dividends = useDividends((s) => s.dividends)
  const addDividend = useDividends((s) => s.addDividend)
  const removeDividend = useDividends((s) => s.removeDividend)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterCodes, setFilterCodes] = useState<string[]>([])
  const [importError, setImportError] = useState<string | null>(null)

  const uniqueCodes = useMemo(
    () => Array.from(new Set(dividends.map((d) => d.code))).sort(),
    [dividends]
  )

  const filtered = useMemo(() => {
    const rows =
      filterCodes.length === 0
        ? dividends
        : dividends.filter((d) => filterCodes.includes(d.code))
    return [...rows].sort((a, b) => b.date.localeCompare(a.date))
  }, [dividends, filterCodes])

  const handleSubmit = (values: DividendFormValues) => {
    addDividend(values)
    toast.success(`${values.code} dividend recorded`)
  }

  const handleDelete = (dividend: Dividend) => {
    if (
      confirm(
        `Delete dividend ${dividend.code} on ${dividend.date}? This cannot be undone.`
      )
    ) {
      removeDividend(dividend.id)
      toast.success(`${dividend.code} dividend deleted`)
    }
  }

  const handleDeleteAll = () => {
    if (dividends.length === 0) return
    if (
      confirm(
        `Delete all ${dividends.length} dividend records? This cannot be undone.`
      )
    ) {
      dividends.forEach((d) => removeDividend(d.id))
      toast.success('All dividends deleted')
    }
  }

  const handleImport = (text: string) => {
    try {
      const parsed = parseDividends(text)
      parsed.forEach((d) => addDividend(d))
      toast.success(`${parsed.length} dividends imported`)
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
          <h1 className="text-2xl font-bold">Dividends</h1>
          <p className="text-muted-foreground text-sm">
            Track dividend receipts. Yield and totals computed from purchase
            history.
          </p>
        </div>
        <div className="flex gap-2">
          {dividends.length > 0 && (
            <Button variant="outline" onClick={handleDeleteAll}>
              Delete All
            </Button>
          )}
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <CsvActions
          filename={`dividends-${todayISO()}.csv`}
          buildCsv={() => serializeDividends(dividends, { purchases, sales })}
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
      </div>

      <DividendsTable
        dividends={filtered}
        purchases={purchases}
        sales={sales}
        onDelete={handleDelete}
      />

      <DividendFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
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
