import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        react({
            include: /resources\/js\/.*\.(j|t)sx?$/,
        }),
    ],
    esbuild: {
        loader: {
            '.js': 'jsx',
            '.mjs': 'jsx',
            '.jsx': 'jsx',
            '.ts': 'ts',
            '.tsx': 'tsx',
        },
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment',
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
                '.mjs': 'jsx',
                '.jsx': 'jsx',
                '.ts': 'ts',
                '.tsx': 'tsx',
            },
        },
    },
    server: {
        host: '127.0.0.1',
        port: 5176,
        hmr: {
            host: '127.0.0.1',
            port: 5176,
        },
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
});
