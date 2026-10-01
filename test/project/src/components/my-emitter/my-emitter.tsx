import { Component, Event, EventEmitter, Listen, Method, State, h, resolveVar } from '@stencil/core';
import { EVENTS } from '../../utils/events.js';

/**
 * Emits and listens to events whose names come from an imported catalog via `resolveVar()`.
 * Used to verify the stencilVitestPlugin resolves imported constants that Stencil's
 * single-file `transpile()` cannot see.
 */
@Component({
  tag: 'my-emitter',
  shadow: true,
})
export class MyEmitter {
  @State() pongCount = 0;

  @Event({ eventName: resolveVar(EVENTS.MY_EMITTER.PING_EVENT) }) ping: EventEmitter<string>;
  @Event({ eventName: resolveVar(EVENTS.MY_EMITTER.PONG_EVENT) }) pong: EventEmitter<void>;

  @Listen(resolveVar(EVENTS.MY_EMITTER.PONG_EVENT))
  onPong() {
    this.pongCount++;
  }

  @Method()
  async emitPing(detail: string) {
    this.ping.emit(detail);
  }

  @Method()
  async emitPong() {
    this.pong.emit();
  }

  render() {
    return <div class="pong-count">{this.pongCount}</div>;
  }
}
