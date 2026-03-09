import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ControlPanel } from '../../src/components/ControlPanel';
import { DEFAULT_STATE } from '../../src/engine/types';

describe('ControlPanel', () => {
  const mockEngine = {
    state: { ...DEFAULT_STATE },
    setTextLine: vi.fn(),
    setTextBox: vi.fn(),
    generateFinalMesh: vi.fn(),
  };

  it('renders all sub-sections', () => {
    render(<ControlPanel engine={mockEngine} />);

    expect(screen.getByText('Nameplate Generator')).toBeInTheDocument();
    expect(screen.getByText('Name Text')).toBeInTheDocument();
    expect(screen.getByText('Download 3MF')).toBeInTheDocument();
    expect(screen.getByText('STL')).toBeInTheDocument();
  });

  it('disables text inputs when no base STL loaded', () => {
    render(<ControlPanel engine={mockEngine} />);

    // Text inputs should be disabled
    const textInputs = screen.getAllByRole('textbox');
    textInputs.forEach((input) => {
      expect(input).toBeDisabled();
    });

    // Export button should be disabled
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
