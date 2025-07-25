import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { JotaiProvider } from '../lib/JotaiProvider'
import { FABProvider } from '../components/FAB/FABContext'

// Test wrapper with all necessary providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <JotaiProvider>
      <FABProvider>
        {children}
      </FABProvider>
    </JotaiProvider>
  )
}

// Custom render function for consistent testing
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestWrapper, ...options })

export * from '@testing-library/react'
export { customRender as render }
