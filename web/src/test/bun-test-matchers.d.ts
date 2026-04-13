declare module 'bun:test' {
  interface Matchers<T> {
    toBeInTheDocument(): void;
    toHaveAttribute(name: string, value?: string): void;
  }
}
