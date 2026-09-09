const { createServer } = await import("vite");
const s = await createServer({ server: { port: 5174, fs: { strict: false }, watch: { usePolling: true } } });
await s.listen();
s.printUrls();
