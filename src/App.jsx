import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom'

import Home from './pages/Home'
import VideoCrud from './pages/VideoCrud'
import VideoWatch from './pages/VideoWatch'
import EditBar from './pages/EditBar'
import CRUDKnowledgeGraph from './pages/CRUDKnowledgeGraph'
import Login from './pages/Login'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>          {/* 👈 Thêm vào đây, TRONG BrowserRouter */}

        <Routes>

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/crud"
            element={
              <ProtectedRoute allowedRoles={['U0']}>
                <VideoCrud />
              </ProtectedRoute>
            }
          />

          <Route
            path="/watch/:videoId"
            element={<VideoWatch />}
          />

          <Route
            path="/edit/:videoId"
            element={<EditBar />}
          />

          <Route
            path="/knowledgeGraph"
            element={<CRUDKnowledgeGraph />}
          />

          <Route
            path="/login"
            element={<Login />}
          />
        </Routes>
      </AuthProvider>

    </BrowserRouter>
  )
}

export default App