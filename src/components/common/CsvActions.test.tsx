import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CsvActions } from './CsvActions'

let capturedBlobText: string | undefined
let capturedFilename: string | undefined
let createObjectURLSpy: ReturnType<typeof vi.fn>
let anchorClickSpy: ReturnType<typeof vi.spyOn>
let downloadSetterSpy: (v: string) => void

beforeEach(() => {
  capturedBlobText = undefined
  capturedFilename = undefined

  createObjectURLSpy = vi.fn((b: Blob) => {
    b.text().then((t) => {
      capturedBlobText = t
    })
    return 'blob:fake'
  })
  Object.defineProperty(URL, 'createObjectURL', {
    value: createObjectURLSpy,
    writable: true,
    configurable: true
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: vi.fn(),
    writable: true,
    configurable: true
  })

  downloadSetterSpy = vi.fn((v: string) => {
    capturedFilename = v
  })
  Object.defineProperty(HTMLAnchorElement.prototype, 'download', {
    set: downloadSetterSpy,
    get: () => capturedFilename ?? '',
    configurable: true
  })

  anchorClickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {})
})

describe('CsvActions Export', () => {
  it('triggers download with given filename and csv content', async () => {
    const user = userEvent.setup()
    render(
      <CsvActions
        filename="purchases-2026-05-22.csv"
        buildCsv={() => 'id,code\np1,BBCA\n'}
        onImport={() => {}}
      />
    )

    await user.click(screen.getByRole('button', { name: /export/i }))

    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(anchorClickSpy).toHaveBeenCalled()
    expect(capturedFilename).toBe('purchases-2026-05-22.csv')
    await waitFor(() =>
      expect(capturedBlobText).toBe('id,code\np1,BBCA\n')
    )
  })
})

describe('CsvActions Import', () => {
  it('calls onImport with file text', async () => {
    const onImport = vi.fn()
    const user = userEvent.setup()
    render(
      <CsvActions
        filename="purchases.csv"
        buildCsv={() => ''}
        onImport={onImport}
      />
    )

    const file = new File(['id,code\np1,BBCA\n'], 'imp.csv', {
      type: 'text/csv'
    })
    const input = screen.getByTestId('csv-import-input') as HTMLInputElement
    await user.upload(input, file)

    await waitFor(() =>
      expect(onImport).toHaveBeenCalledWith('id,code\np1,BBCA\n')
    )
  })
})
