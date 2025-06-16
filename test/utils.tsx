import React from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Custom render function for consistent testing
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options })

export * from '@testing-library/react'
export { customRender as render }
