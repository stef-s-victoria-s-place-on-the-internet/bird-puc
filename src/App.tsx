import './App.css'
import { Routes, Route } from 'react-router-dom'
import { DetectionsList } from './components/DetectionsList'
import { SpeciesDetail } from './pages/SpeciesDetail'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<DetectionsList />} />
        <Route path="/species/:speciesId" element={<SpeciesDetail />} />
      </Routes>
    </div>
  )
}

export default App
