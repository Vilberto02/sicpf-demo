import { RouterProvider } from 'react-router-dom'
import routes from './router/AppRouter'
import { Toaster } from '@/components/ui/sonner'

function App() {

  return (
    <>
      <RouterProvider router={routes}></RouterProvider>
      <Toaster position="top-right" richColors theme="light" />
    </>
  )
}

export default App
