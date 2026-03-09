import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from '../../src/components/ExportButton';

describe('ExportButton', () => {
  it('shows "Download 3MF" and "STL" buttons in default state', () => {
    render(
      <ExportButton onGenerate={vi.fn()} isProcessing={false} disabled={false} />,
    );
    expect(screen.getByText('Download 3MF')).toBeInTheDocument();
    expect(screen.getByText('STL')).toBeInTheDocument();
  });

  it('both buttons disabled when disabled prop is true', () => {
    render(
      <ExportButton onGenerate={vi.fn()} isProcessing={false} disabled={true} />,
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('shows "Generating..." when isProcessing is true', () => {
    render(
      <ExportButton onGenerate={vi.fn()} isProcessing={true} disabled={false} />,
    );
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  it('both buttons disabled when isProcessing is true', () => {
    render(
      <ExportButton onGenerate={vi.fn()} isProcessing={true} disabled={false} />,
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('calls onGenerate with "3mf" when 3MF button clicked', () => {
    const onGenerate = vi.fn();
    render(
      <ExportButton onGenerate={onGenerate} isProcessing={false} disabled={false} />,
    );
    fireEvent.click(screen.getByText('Download 3MF'));
    expect(onGenerate).toHaveBeenCalledWith('3mf');
  });

  it('calls onGenerate with "stl" when STL button clicked', () => {
    const onGenerate = vi.fn();
    render(
      <ExportButton onGenerate={onGenerate} isProcessing={false} disabled={false} />,
    );
    fireEvent.click(screen.getByText('STL'));
    expect(onGenerate).toHaveBeenCalledWith('stl');
  });
});
