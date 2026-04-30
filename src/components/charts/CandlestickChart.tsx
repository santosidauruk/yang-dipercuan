'use client'
import { useEffect, useRef } from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  CandlestickSeries,
  DeepPartial,
  ChartOptions,
  customSeriesDefaultOptions
} from 'lightweight-charts'
import type { OHLCV } from '@/types'
import { useTheme } from 'next-themes'
import { custom } from 'zod'

interface Props {
  data: OHLCV[]
}

const LIGHT_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    background: {
      type: ColorType.Solid,
      color: '#FFFFFF'
    },
    textColor: '#191919'
  },
  grid: {
    vertLines: { color: '#D6DCDE' },
    horzLines: { color: '#D6DCDE' }
  }
}

const DARK_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    background: {
      type: ColorType.Solid,
      color: '#0a0a0a'
    },
    textColor: '#fafafa'
  },
  grid: {
    vertLines: { color: '#444' },
    horzLines: { color: '#444' }
  }
}

const chartLayoutOptions = (theme: string): DeepPartial<ChartOptions> => {
  return theme === 'light' ? LIGHT_CHART_OPTIONS : DARK_CHART_OPTIONS
}

export const CandlestickChart = ({ data }: Props) => {
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const handleResize = () => {
      chart.applyOptions({ width: containerRef.current?.clientWidth })
    }

    const chart = createChart(containerRef.current, {
      ...chartLayoutOptions(resolvedTheme as string),
      width: containerRef.current?.clientWidth
    })
    chart.timeScale().fitContent()
    const series = chart.addSeries(CandlestickSeries)
    chartRef.current = chart
    seriesRef.current = series

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)

      chart.remove()
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current || !data.length) return

    // Yahoo Finance returns the full dataset each time, so we set fullset data foreach changes
    seriesRef.current.setData(data)

    chartRef.current?.timeScale().fitContent()
  }, [data])

  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.applyOptions({
      ...chartLayoutOptions(resolvedTheme as string)
    })
  }, [resolvedTheme])

  return <div ref={containerRef} className="h-[400px] w-full"></div>
}
