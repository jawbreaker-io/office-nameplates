import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParameterControls } from '../../src/components/ParameterControls';

describe('ParameterControls', () => {
  const defaultProps = {
    embossDepth: 1.5,
    fontSize: 8,
    onEmbossDepthChange: vi.fn(),
    onFontSizeChange: vi.fn(),
    disabled: false,
  };

  it('renders emboss depth slider with current value', () => {
    render(<ParameterControls {...defaultProps} />);
    expect(screen.getByText('Emboss Depth')).toBeInTheDocument();
    expect(screen.getByText('1.5 mm')).toBeInTheDocument();
  });

  it('renders font size slider with current value', () => {
    render(<ParameterControls {...defaultProps} />);
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('8 pt')).toBeInTheDocument();
  });

  it('moving emboss depth slider calls onChange', () => {
    const onEmbossDepthChange = vi.fn();
    render(
      <ParameterControls {...defaultProps} onEmbossDepthChange={onEmbossDepthChange} />,
    );
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '2.5' } });
    expect(onEmbossDepthChange).toHaveBeenCalledWith(2.5);
  });

  it('moving font size slider calls onChange', () => {
    const onFontSizeChange = vi.fn();
    render(
      <ParameterControls {...defaultProps} onFontSizeChange={onFontSizeChange} />,
    );
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[1], { target: { value: '12' } });
    expect(onFontSizeChange).toHaveBeenCalledWith(12);
  });

  it('sliders disabled when disabled prop is true', () => {
    render(<ParameterControls {...defaultProps} disabled={true} />);
    const sliders = screen.getAllByRole('slider');
    sliders.forEach((slider) => {
      expect(slider).toBeDisabled();
    });
  });
});
