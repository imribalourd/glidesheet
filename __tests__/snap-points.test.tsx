import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { useState } from 'react';
import { BottomSheet } from '../src';
import type { SnapPoint } from '../src';

afterEach(cleanup);

function SnapPointSheet({
  snapPoints = [0, 0.5, 1] as SnapPoint[],
  defaultSnapPoint,
}: {
  snapPoints?: SnapPoint[];
  defaultSnapPoint?: SnapPoint;
}) {
  const [open, setOpen] = useState(true);
  const [activeSnap, setActiveSnap] = useState<SnapPoint | null>(defaultSnapPoint ?? snapPoints[1]);

  return (
    <BottomSheet.Root
      open={open}
      onOpenChange={setOpen}
      snapPoints={snapPoints}
      activeSnapPoint={activeSnap}
      onActiveSnapPointChange={setActiveSnap}
      modal={false}
    >
      <BottomSheet.Portal>
        <BottomSheet.Content data-testid="content">
          <BottomSheet.Handle data-testid="handle" />
          <BottomSheet.Title>Snap Points</BottomSheet.Title>
          <p data-testid="snap-value">{String(activeSnap)}</p>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet.Root>
  );
}

describe('Snap Points', () => {
  it('renders with snap points data attribute', () => {
    render(<SnapPointSheet />);
    expect(screen.getByTestId('content').getAttribute('data-snap-points')).toBe('true');
  });

  it('sets --snap-point-height CSS variable', () => {
    render(<SnapPointSheet />);
    const content = screen.getByTestId('content');
    const style = content.getAttribute('style') || '';
    expect(style).toContain('--snap-point-height');
  });

  it('accepts pixel string snap points', () => {
    render(<SnapPointSheet snapPoints={[0, '200px', 1]} defaultSnapPoint="200px" />);
    expect(screen.getByTestId('snap-value').textContent).toBe('200px');
  });

  it('renders handle with data-glidesheet-handle', () => {
    render(<SnapPointSheet />);
    const handle = screen.getByTestId('handle');
    expect(handle.getAttribute('data-glidesheet-handle')).toBe('');
  });

  it('handle has hit area child', () => {
    render(<SnapPointSheet />);
    const handle = screen.getByTestId('handle');
    const hitArea = handle.querySelector('[data-glidesheet-handle-hitarea]');
    expect(hitArea).not.toBeNull();
  });
});
