import type { Timeframe, AssetAllocation } from '@/types'

export const IDX_STOCKS: { code: string; name: string; sector: string }[] = [
  // Banking
  { code: 'BBCA.JK', name: 'Bank Central Asia', sector: 'Banking' },
  { code: 'BBRI.JK', name: 'Bank Rakyat Indonesia', sector: 'Banking' },
  { code: 'BMRI.JK', name: 'Bank Mandiri', sector: 'Banking' },
  { code: 'BBNI.JK', name: 'Bank Negara Indonesia', sector: 'Banking' },
  { code: 'BRIS.JK', name: 'Bank Syariah Indonesia', sector: 'Banking' },
  // Telco
  { code: 'TLKM.JK', name: 'Telkom Indonesia', sector: 'Telco' },
  { code: 'EXCL.JK', name: 'XL Axiata', sector: 'Telco' },
  { code: 'ISAT.JK', name: 'Indosat Ooredoo', sector: 'Telco' },
  // Consumer
  { code: 'UNVR.JK', name: 'Unilever Indonesia', sector: 'Consumer' },
  { code: 'ICBP.JK', name: 'Indofood CBP', sector: 'Consumer' },
  { code: 'INDF.JK', name: 'Indofood Sukses Makmur', sector: 'Consumer' },
  { code: 'MYOR.JK', name: 'Mayora Indah', sector: 'Consumer' },
  // Mining
  { code: 'ADRO.JK', name: 'Adaro Energy', sector: 'Mining' },
  { code: 'ANTM.JK', name: 'Aneka Tambang', sector: 'Mining' },
  { code: 'PTBA.JK', name: 'Bukit Asam', sector: 'Mining' },
  { code: 'INCO.JK', name: 'Vale Indonesia', sector: 'Mining' },
  // Automotive
  { code: 'ASII.JK', name: 'Astra International', sector: 'Automotive' },
  { code: 'AUTO.JK', name: 'Astra Otoparts', sector: 'Automotive' },
  // Property
  { code: 'BSDE.JK', name: 'Bumi Serpong Damai', sector: 'Property' },
  { code: 'CTRA.JK', name: 'Ciputra Development', sector: 'Property' },
  { code: 'SMRA.JK', name: 'Summarecon Agung', sector: 'Property' },
  // Cement & Construction
  { code: 'SMGR.JK', name: 'Semen Indonesia', sector: 'Construction' },
  { code: 'WIKA.JK', name: 'Wijaya Karya', sector: 'Construction' },
  // Energy
  { code: 'PGAS.JK', name: 'Perusahaan Gas Negara', sector: 'Energy' },
  { code: 'AKRA.JK', name: 'AKR Corporindo', sector: 'Energy' },
  // Healthcare
  { code: 'KLBF.JK', name: 'Kalbe Farma', sector: 'Healthcare' },
  { code: 'SIDO.JK', name: 'Sido Muncul', sector: 'Healthcare' },
  // Technology
  { code: 'GOTO.JK', name: 'GoTo Gojek Tokopedia', sector: 'Technology' },
  { code: 'BUKA.JK', name: 'Bukalapak', sector: 'Technology' },
  { code: 'EMTK.JK', name: 'Elang Mahkota Teknologi', sector: 'Technology' }
]

export const SECTORS = [
  'Banking',
  'Telco',
  'Consumer',
  'Mining',
  'Automotive',
  'Property',
  'Construction',
  'Energy',
  'Healthcare',
  'Technology'
] as const

export type Sector = (typeof SECTORS)[number]

export const TIMEFRAMES: {
  value: Timeframe
  label: string
  interval: string
  range: string
}[] = [
  { value: '1m', label: '1M', interval: '1m', range: '1d' },
  { value: '5m', label: '5M', interval: '5m', range: '5d' },
  { value: '15m', label: '15M', interval: '15m', range: '5d' },
  { value: '1h', label: '1H', interval: '60m', range: '1mo' },
  { value: '1D', label: '1D', interval: '1d', range: '6mo' },
  { value: '1W', label: '1W', interval: '1wk', range: '2y' },
  { value: '1M', label: '1MO', interval: '1mo', range: '5y' }
]

export const RISK_ALLOCATIONS: Record<string, AssetAllocation> = {
  conservative: {
    saham: 20,
    obligasi: 40,
    reksaDanaPasarUang: 30,
    deposito: 10
  },
  moderate: { saham: 50, obligasi: 30, reksaDanaPasarUang: 15, deposito: 5 },
  aggressive: { saham: 80, obligasi: 10, reksaDanaPasarUang: 5, deposito: 5 }
}

export const CHART_COLORS = [
  '#2563eb', // blue
  '#16a34a', // green
  '#dc2626', // red
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1' // indigo
]

export const IHSG_CODE = '^JKSE'
