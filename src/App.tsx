import { BrowserRouter } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center text-primary-600">
            CV Matcher
          </h1>
          <p className="text-center text-gray-600 mt-2">
            AI-Powered Resume Analysis - Coming Soon
          </p>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
