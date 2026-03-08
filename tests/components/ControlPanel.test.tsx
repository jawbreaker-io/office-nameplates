import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ControlPanel } from '../../src/components/ControlPanel';
import { DEFAULT_STATE } from '../../src/engine/types';

describe('ControlPanel', () => {
  const mockEngine = {
    state: { ...DEFAULT_STATE },
    loadBaseSTL: vi.fn(),
    setTextLine: vi.fn(),
    setEmbossDepth: vi.fn(),
    setFontSize: vi.fn(),
    loadLogo: vi.fn(),
    generateFinalMesh: vi.fn(),
  };

  it('renders all sub-sections', () => {
    render(<ControlPanel engine={mockEngine} />);

    expect(screen.getByText('Nameplate Generator')).toBeInTheDocument();
    expect(screen.getByText('Base Nameplate STL')).toBeInTheDocument();
    expect(screen.getByText('Name Text')).toBeInTheDocument();
    expect(screen.getByText('Company Logo (SVG)')).toBeInTheDocument();
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('Generate & Download STL')).toBeInTheDocument();
  });

  it('disables text/logo/params/export when no base STL loaded', () => {
    render(<ControlPanel engine={mockEngine} />);

    // Text inputs should be disabled
    const textInputs = screen.getAllByRole('textbox');
    textInputs.forEach((input) => {
      expect(input).toBeDisabled();
    });

    // Sliders should be disabled
    const sliders = screen.getAllByRole('slider');
    sliders.forEach((slider) => {
      expect(slider).toBeDisabled();
    });

    // Export button should be disabled
    expect(screen.getByRole('button', { name: /generate/i })).toBeDisabled();
  });
});
