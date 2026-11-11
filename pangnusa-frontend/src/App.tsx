import { Navigate, Route, Routes } from 'react-router'
import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/DashboardPage'
import JelajahiKabupatenPage from './pages/JelajahiKabupatenPage'
import DetailKabupatenPage from './pages/DetailKabupatenPage'
import TentangSistemPage from './pages/TentangSistemPage'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="jelajahi" element={<JelajahiKabupatenPage />} />
        <Route path="kabupaten/:kode" element={<DetailKabupatenPage />} />
        <Route path="tentang" element={<TentangSistemPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
