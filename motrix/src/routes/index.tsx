import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import App from '../App.tsx'
import Login from '../pages/Login.tsx'

const Dashboard = lazy(() => import('../pages/Dashboard.tsx'))

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={null}>
              <Dashboard />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
