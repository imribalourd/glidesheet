import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useState } from 'react';
import { BottomSheet } from '../src';

afterEach(cleanup);

function SimpleSheet({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <BottomSheet.Root open={open} onOpenChange={setOpen} modal={false}>
      <BottomSheet.Trigger data-testid="trigger">Open</BottomSheet.Trigger>
      <BottomSheet.Portal>
        <BottomSheet.Content data-testid="content">
          <BottomSheet.Title data-testid="title">Test Sheet</BottomSheet.Title>
          <BottomSheet.Description data-testid="description">A test sheet</BottomSheet.Description>
          <BottomSheet.Close data-testid="close">Close</BottomSheet.Close>
          <p>Content here</p>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet.Root>
  );
}

describe('BottomSheet', () => {
  it('renders trigger', () => {
    render(<SimpleSheet />);
    expect(screen.getByTestId('trigger')).toBeDefined();
  });

  it('opens when trigger is clicked', () => {
    render(<SimpleSheet />);
    fireEvent.click(screen.getByTestId('trigger'));
    expect(screen.getByTestId('content')).toBeDefined();
    expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
  });

  it('closes when close button is clicked', () => {
    render(<SimpleSheet defaultOpen />);
    expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
    fireEvent.click(screen.getByTestId('close'));
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('sets role=dialog on content', () => {
    render(<SimpleSheet defaultOpen />);
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('links title via aria-labelledby', () => {
    render(<SimpleSheet defaultOpen />);
    const dialog = screen.getByRole('dialog');
    const titleId = screen.getByTestId('title').id;
    expect(dialog.getAttribute('aria-labelledby')).toBe(titleId);
  });

  it('links description via aria-describedby', () => {
    render(<SimpleSheet defaultOpen />);
    const dialog = screen.getByRole('dialog');
    const descId = screen.getByTestId('description').id;
    expect(dialog.getAttribute('aria-describedby')).toBe(descId);
  });

  it('trigger has aria-haspopup and aria-expanded', () => {
    render(<SimpleSheet />);
    const trigger = screen.getByTestId('trigger');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('renders safe area extension element when not floating', () => {
    render(<SimpleSheet defaultOpen />);
    const content = screen.getByTestId('content');
    const extension = content.querySelector('[data-glidesheet-extension]');
    expect(extension).not.toBeNull();
  });
});

describe('BottomSheet controlled', () => {
  function ControlledSheet() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button data-testid="external-open" onClick={() => setOpen(true)}>
          Open externally
        </button>
        <button data-testid="external-close" onClick={() => setOpen(false)}>
          Close externally
        </button>
        <BottomSheet.Root open={open} onOpenChange={setOpen} modal={false}>
          <BottomSheet.Portal>
            <BottomSheet.Content data-testid="content">
              <BottomSheet.Title>Controlled</BottomSheet.Title>
              <p>Controlled content</p>
            </BottomSheet.Content>
          </BottomSheet.Portal>
        </BottomSheet.Root>
      </>
    );
  }

  it('opens via external state', () => {
    render(<ControlledSheet />);
    fireEvent.click(screen.getByTestId('external-open'));
    expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
  });

  it('closes via external state', () => {
    render(<ControlledSheet />);
    fireEvent.click(screen.getByTestId('external-open'));
    expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
    fireEvent.click(screen.getByTestId('external-close'));
    expect(screen.queryByTestId('content')).toBeNull();
  });
});

describe('BottomSheet dismissible', () => {
  function NonDismissibleSheet() {
    const [open, setOpen] = useState(true);
    return (
      <BottomSheet.Root open={open} onOpenChange={setOpen} dismissible={false} modal={false}>
        <BottomSheet.Portal>
          <BottomSheet.Content data-testid="content">
            <BottomSheet.Title>Non-dismissible</BottomSheet.Title>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet.Root>
    );
  }

  it('does not close on ESC when dismissible=false', () => {
    render(<NonDismissibleSheet />);
    expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
  });
});

describe('BottomSheet floating', () => {
  function FloatingSheet() {
    return (
      <BottomSheet.Root open={true} onOpenChange={() => {}} floating modal={false}>
        <BottomSheet.Portal>
          <BottomSheet.Content data-testid="content">
            <BottomSheet.Title>Floating</BottomSheet.Title>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet.Root>
    );
  }

  it('sets data-floating=true', () => {
    render(<FloatingSheet />);
    expect(screen.getByTestId('content').getAttribute('data-floating')).toBe('true');
  });

  it('does not render extension element when floating', () => {
    render(<FloatingSheet />);
    const content = screen.getByTestId('content');
    const extension = content.querySelector('[data-glidesheet-extension]');
    expect(extension).toBeNull();
  });
});
