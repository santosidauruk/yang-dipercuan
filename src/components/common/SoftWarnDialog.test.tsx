import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SoftWarnDialog } from './SoftWarnDialog'

describe('SoftWarnDialog', () => {
  it('renders title and description when open', () => {
    render(
      <SoftWarnDialog
        open
        onOpenChange={() => {}}
        title="Warning"
        description="This is a soft warning"
        onConfirm={() => {}}
      />
    )

    expect(screen.getByText('Warning')).toBeInTheDocument()
    expect(screen.getByText('This is a soft warning')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(
      <SoftWarnDialog
        open={false}
        onOpenChange={() => {}}
        title="Warning"
        description="hidden"
        onConfirm={() => {}}
      />
    )

    expect(screen.queryByText('Warning')).not.toBeInTheDocument()
  })

  it('calls onConfirm and closes when confirm button clicked', async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <SoftWarnDialog
        open
        onOpenChange={onOpenChange}
        title="Warning"
        description="proceed?"
        confirmLabel="Continue"
        onConfirm={onConfirm}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes without onConfirm when cancel clicked', async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()

    render(
      <SoftWarnDialog
        open
        onOpenChange={onOpenChange}
        title="Warning"
        description="proceed?"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
