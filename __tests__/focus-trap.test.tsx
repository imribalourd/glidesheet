import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useState } from 'react';
import { BottomSheet } from '../src';

afterEach(cleanup);

function ModalSheetWithInputs() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button data-testid="outside-button">Outside</button>
      <BottomSheet.Root open={open} onOpenChange={setOpen} modal={true}>
        <BottomSheet.Portal>
          <BottomSheet.Content data-testid="content">
            <BottomSheet.Title>Focus Test</BottomSheet.Title>
            <input data-testid="input-1" />
            <input data-testid="input-2" />
            <BottomSheet.Close data-testid="close">Close</BottomSheet.Close>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet.Root>
    </>
  );
}

function NonModalSheetWithInputs() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button data-testid="outside-button">Outside</button>
      <BottomSheet.Root open={open} onOpenChange={setOpen} modal={false}>
        <BottomSheet.Portal>
          <BottomSheet.Content data-testid="content">
            <BottomSheet.Title>Non-modal Focus</BottomSheet.Title>
            <input data-testid="input-1" />
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet.Root>
    </>
  );
}

describe('Focus Trap', () => {
  it('sets aria-modal=true in modal mode', () => {
    render(<ModalSheetWithInputs />);
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
  });

  it('sets aria-modal=false in non-modal mode', () => {
    render(<NonModalSheetWithInputs />);
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('false');
  });

  it('closes on ESC key in modal mode', () => {
    render(<ModalSheetWithInputs />);
    expect(screen.getByTestId('content').getAttribute('data-state')).toBe('open');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('content')).toBeNull();
  });
});
