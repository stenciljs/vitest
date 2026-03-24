import { describe, it, expect, h } from '@stencil/vitest';
import { render } from '@stencil/vitest';

describe('spy-helper (browser)', () => {

  it('spies on methods in real browser', async () => {
    const { root, spies } = await render(<my-button>Click me</my-button>, {
      spyOn: { methods: ['handleClick'] }
    });

    expect(spies?.methods.handleClick).toBeDefined();

    const button = root.shadowRoot?.querySelector('button');
    button?.click();

    expect(spies?.methods.handleClick).toHaveBeenCalledTimes(1);
  });

  it('spies on props in real browser', async () => {
    const { spies, setProps, waitForChanges } = await render(<my-button variant="primary">Click me</my-button>, {
      spyOn: { props: ['variant'] }
    });

    expect(spies?.props.variant).toBeDefined();

    await setProps({ variant: 'danger' });
    await waitForChanges();

    expect(spies?.props.variant).toHaveBeenCalledWith('danger');
  });

  it('auto-stubs lifecycle methods in real browser', async () => {
    const { spies } = await render(<my-button>Click me</my-button>, {
      spyOn: { lifecycle: ['componentWillLoad', 'componentDidLoad'] }
    });

    expect(spies?.lifecycle.componentWillLoad).toHaveBeenCalled();
    expect(spies?.lifecycle.componentDidLoad).toHaveBeenCalled();
  });

});
