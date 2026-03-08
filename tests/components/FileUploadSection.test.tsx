import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUploadSection } from '../../src/components/FileUploadSection';

describe('FileUploadSection', () => {
  const defaultProps = {
    onFileSelected: vi.fn(),
    isBaseLoaded: false,
    isProcessing: false,
  };

  it('renders upload dropzone with instruction text', () => {
    render(<FileUploadSection {...defaultProps} />);
    expect(screen.getByText('Drop .stl file here or click to browse')).toBeInTheDocument();
  });

  it('selecting a .stl file calls onFileSelected', () => {
    const onFileSelected = vi.fn();
    render(<FileUploadSection {...defaultProps} onFileSelected={onFileSelected} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'plate.stl', { type: 'application/octet-stream' });

    fireEvent.change(input, { target: { files: [file] } });
    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it('selecting a non-.stl file shows validation error', () => {
    render(<FileUploadSection {...defaultProps} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'model.obj', { type: 'application/octet-stream' });

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText('Please select an .stl file.')).toBeInTheDocument();
  });

  it('shows filename after successful upload', () => {
    render(<FileUploadSection {...defaultProps} isBaseLoaded={true} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'nameplate.stl', { type: 'application/octet-stream' });

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText(/nameplate\.stl/)).toBeInTheDocument();
  });
});
