import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

/**
 * A simple button component for testing
 */
@Component({
  tag: 'my-button',
  styleUrl: 'my-button.css',
  shadow: true,
})
export class MyButton {
  /**
   * The button variant style
   */
  @Prop() variant: 'primary' | 'secondary' | 'danger' = 'primary';

  /**
   * Whether the button is disabled
   */
  @Prop() disabled: boolean = false;

  /**
   * Button size
   */
  @Prop() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Emitted when the button is clicked
   */
  @Event() buttonClick: EventEmitter<MouseEvent>;

  private handleClick = (event: MouseEvent) => {
    if (!this.disabled) {
      this.buttonClick.emit(event);
    }
  };

  render() {
    return (
      <button
        class={`button button--${this.variant} button--${this.size}`}
        disabled={this.disabled ? true : undefined}
        onClick={this.handleClick}
        type="button"
      >
        <slot />
      </button>
    );
  }
}
