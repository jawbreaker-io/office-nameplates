import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from '../../src/components/ExportButton';

describe('ExportButton', () => {
  it('shows "Generate & Download STL" in default state', () => {
    render(
      <ExportButton onGenerate={vi.fn()} isProcessing={false} disabled={false} />,
    );
    expect(screen.getByText('Generate & Download STL')).toBeInTheDocument();
  });

  it('disabled when disabled prop is true', () => {
    render(
      <ExportButton onGenerate={vi.fn()} isProcessing={false} disabled={true} />,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows "Generating..." when isProcessing is true', () => {
    render(
      <ExportButton onGenerate={vi.fn()} isProcessing={true} disabled={false} />,
    );
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  it('is disabled when isProcessing is true', () => {
    render(
      <ExportButton onGenerate={vi.fn()} isProcessing={true} disabled={false} />,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onGenerate when clicked', () => {
    const onGenerate = vi.fn();
    render(
      <ExportButton onGenerate={onGenerate} isProcessing={false} disabled={false} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onGenerate).toHaveBeenCalledOnce();
  });
});
