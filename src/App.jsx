import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
} from 'react-router-dom'
import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Home from './pages/Home'
import VideoCrud from './pages/VideoCrud'
import VideoWatch from './pages/VideoWatch'
import EditBar from './pages/EditBar'
import CRUDKnowledgeGraph from './pages/CRUDKnowledgeGraph'
import CRUDBattler from './pages/CRUDBattler'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { barReaction } from '../src/services/api' // 👈 đổi đúng tên service bạn đang dùng
import { RAGChatBot } from './components/RAGChatBot'
// Component con, nằm TRONG BrowserRouter + AuthProvider nên mới dùng được useLocation() và useAuth()
function AppContent() {
  const location = useLocation()
  const { user } = useAuth()
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.userId) return

    const key = `pending_reactions_${user.userId}`
    const raw = localStorage.getItem(key)
    if (!raw) return

    const reactions = JSON.parse(raw)
    if (Object.keys(reactions).length === 0) return

    const payload = Object.entries(reactions).map(([barId, reactionType]) => ({
      barID: barId,
      ReactionType: reactionType,
    }))

    console.log('Retrying pending reactions:', payload)

    barReaction.bulkCreate(payload)
      .then(() => {
        localStorage.removeItem(key)

        queryClient.invalidateQueries({
          queryKey: ['bar-reactions']
        });
      })
      .catch((err) => {
        // const isNetworkError = !err?.response
        // if (!isNetworkError) {
        //   localStorage.removeItem(key) // lỗi logic thì xoá, tránh kẹt mãi
        // }
        // lỗi mạng thì giữ nguyên, chờ lần đổi path sau tự retry

        localStorage.removeItem(key)

      })
  }, [user?.userId, location.pathname])

  return (
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
        element={
          <ProtectedRoute allowedRoles={['U0']}>
            <EditBar />
          </ProtectedRoute>
        }
      />

      <Route
        path="/knowledgeGraph"
        element={
          <ProtectedRoute allowedRoles={['U0']}>
            <CRUDKnowledgeGraph />
          </ProtectedRoute>
        }
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/chatbot"
        element={<RAGChatBot />}
      />

      <Route
        path="/CRUDbattler"
        element={
          <ProtectedRoute allowedRoles={['U0']}>
            <CRUDBattler />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App