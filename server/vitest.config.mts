import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
        passWithNoTests: true,
        setupFiles: ['tests/setup.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: [
                'src/server.ts',
                'src/types/**',
            ],
        }
    },
});
