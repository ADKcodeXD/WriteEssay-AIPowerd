// Shared business services use Nest decorators locally. Workers construct them
// explicitly, without booting an HTTP server or the Nest dependency container.
export const Injectable = () => (target: unknown) => target
export const Logger = {
  log: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
}
