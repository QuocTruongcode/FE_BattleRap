import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom'

import Home from './pages/Home'
import VideoCrud from './pages/VideoCrud'
import VideoWatch from './pages/VideoWatch'
import EditBar from './pages/EditBar'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/crud"
          element={<VideoCrud />}
        />

        <Route
          path="/watch/:videoId"
          element={<VideoWatch />}
        />

        <Route
          path="/edit/:videoId"
          element={<EditBar />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App