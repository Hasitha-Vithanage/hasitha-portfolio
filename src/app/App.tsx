import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from '../components/layout/Layout'
import Home from '../pages/Home/Home'
import ProjectDetails from '../pages/ProjectDetails/ProjectDetails'
import NotFound from '../pages/NotFound/NotFound'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="projects/:slug" element={<ProjectDetails />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
