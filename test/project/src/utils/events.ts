/**
 * Shared event-name catalog, the way design systems typically centralise custom event
 * names so emitters and listeners never drift apart.
 *
 * Imported by `my-emitter.tsx` and read through `resolveVar()` in its decorators. Stencil's
 * single-file `transpile()` cannot follow this import on its own; the plugin inlines the
 * literals before compiling.
 */
export const EVENTS = {
  MY_EMITTER: {
    PING_EVENT: 'myEmitterPing',
    PONG_EVENT: 'myEmitterPong',
  },
} as const;
