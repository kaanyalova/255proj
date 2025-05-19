import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                game: resolve(__dirname, 'game/index.html'),
                form: resolve(__dirname, 'form.html'),
                swipes: resolve(__dirname, 'swipes.html'),
                profile: resolve(__dirname, 'profile.html'),
                login: resolve(__dirname, 'login.html'),
                home: resolve(__dirname, 'home.html'),
            },
        },
    },
    server: {
        proxy: {
            '/api': 'http://0.0.0.0:11223 ',
        },
    },
});
