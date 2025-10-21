import './App.css'
import { Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { DetectionsList } from './components/DetectionsList'
import { SpeciesDetail } from './pages/SpeciesDetail'
import { queryClient, setupQueryPersistence } from './lib/queryClient'

// Setup persistent caching with IndexedDB
setupQueryPersistence()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <Routes>
          <Route path="/" element={<DetectionsList />} />
          <Route path="/species/:speciesId" element={<SpeciesDetail />} />
        </Routes>
      </div>
      {/* DevTools for debugging queries in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

export default App
