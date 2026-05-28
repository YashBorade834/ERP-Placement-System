// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default () => {
//   return defineConfig({
//     plugins: [react()],
//     server: {
//       host: '0.0.0.0',
//       allowedHosts: 'all',
//     },
//   })
// }

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok-free.dev',
      '.ngrok.io'
    ]
  }
})