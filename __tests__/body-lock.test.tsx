import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useState } from 'react';
import { BottomSheet } from '../src';

afterEach(cleanup);

function ModalSheet() {
  const [open, setOpen] = useState(false);
  return (
    <BottomSheet.Root open={open} onOpenChange={setOpen} modal={true}>
      <BottomSheet.Trigger data-testid="trigger">Open</BottomSheet.Trigger>
      <BottomSheet.Portal>
        <BottomSheet.Overlay data-testid="overlay" />
        <BottomSheet.Content data-testid="content">
          <BottomSheet.Title>Modal</BottomSheet.Title>
          <BottomSheet.Close data-testid="close">Close</BottomSheet.Close>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet.Root>
  );
}

function NonModalSheet() {
  const [open, setOpen] = useState(true);
  return (
    <BottomSheet.Root open={open} onOpenChange={setOpen} modal={false}>
      <BottomSheet.Portal>
        <BottomSheet.Content data-testid="content">
          <BottomSheet.Title>Non-modal</BottomSheet.Title>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet.Root>
  );
}

describe('Body Lock', () => {
  it('sets overflow hidden on body when modal opens', () => {
    render(<ModalSheet />);
    fireEvent.click(screen.getByTestId('trigger'));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores overflow when modal closes', () => {
    render(<ModalSheet />);
    fireEvent.click(screen.getByTestId('trigger'));
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(screen.getByTestId('close'));
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('does not lock body when modal=false', () => {
    const origOverflow = document.body.style.overflow;
    render(<NonModalSheet />);
    expect(document.body.style.overflow).toBe(origOverflow);
  });
});

describe('Overlay', () => {
  it('renders overlay in modal mode', () => {
    render(<ModalSheet />);
    fireEvent.click(screen.getByTestId('trigger'));
    expect(screen.getByTestId('overlay')).toBeDefined();
  });

  it('does not render overlay in non-modal mode', () => {
    render(<NonModalSheet />);
    expect(screen.queryByTestId('overlay')).toBeNull();
  });

  it('overlay has correct data-state', () => {
    render(<ModalSheet />);
    fireEvent.click(screen.getByTestId('trigger'));
    expect(screen.getByTestId('overlay').getAttribute('data-state')).toBe('open');
  });
});
