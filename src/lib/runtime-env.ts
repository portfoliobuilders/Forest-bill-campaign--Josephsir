/** Read env at runtime. Avoids Next.js inlining empty NEXT_PUBLIC_* values at build. */
export function runtimeEnv(name: string): string {
  return String(process.env[name] ?? '').trim()
}
