import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { App } from './App'
import '../shared/i18n/config'

it('renders the five-route shell on the projects screen', async () => {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/projects']}><App /></MemoryRouter></QueryClientProvider>)
  expect(await screen.findByRole('heading', { name: /Исследовательские проекты/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Создать проект/i })).toBeInTheDocument()
})
