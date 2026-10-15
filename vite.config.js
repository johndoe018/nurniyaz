import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'development-html-entry',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url === '/' || request.url === '/index.html') request.url = '/app.html';
        next();
      });
    },
  }],
  worker: { format: 'es' },
  build: { target: 'es2022', rollupOptions: { input: 'app.html' } },
});
