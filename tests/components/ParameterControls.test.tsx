import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParameterControls } from '../../src/components/ParameterControls';

describe('ParameterControls', () => {
  const defaultProps = {
    fontSize: 8,
    onFontSizeChange: vi.fn(),
    disabled: false,
  };

  it('renders font size slider with current value', () => {
    render(<ParameterControls {...defaultProps} />);
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('8 pt')).toBeInTheDocument();
  });

  it('moving font size slider calls onChange', () => {
    const onFontSizeChange = vi.fn();
    render(
      <ParameterControls {...defaultProps} onFontSizeChange={onFontSizeChange} />,
    );
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '12' } });
    expect(onFontSizeChange).toHaveBeenCalledWith(12);
  });

  it('slider disabled when disabled prop is true', () => {
    render(<ParameterControls {...defaultProps} disabled={true} />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeDisabled();
  });
});
