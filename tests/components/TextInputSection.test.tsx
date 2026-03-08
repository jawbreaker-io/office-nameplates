import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextInputSection } from '../../src/components/TextInputSection';

describe('TextInputSection', () => {
  const defaultProps = {
    textLines: ['', '', ''] as [string, string, string],
    onTextChange: vi.fn(),
    isProcessing: false,
    disabled: false,
  };

  it('renders 3 labeled inputs', () => {
    render(<TextInputSection {...defaultProps} />);
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Title / Extra')).toBeInTheDocument();
  });

  it('typing in First Name applies capitalize transformation', async () => {
    const onTextChange = vi.fn();
    render(<TextInputSection {...defaultProps} onTextChange={onTextChange} />);
    const user = userEvent.setup();

    const firstNameInput = screen.getByPlaceholderText('First Name');
    await user.type(firstNameInput, 'j');

    // First Name: capitalize first letter, lowercase rest
    expect(onTextChange).toHaveBeenCalledWith(0, 'J');
  });

  it('typing in Last Name applies uppercase transformation', async () => {
    const onTextChange = vi.fn();
    render(<TextInputSection {...defaultProps} onTextChange={onTextChange} />);
    const user = userEvent.setup();

    const lastNameInput = screen.getByPlaceholderText('Last Name');
    await user.type(lastNameInput, 'd');

    // Last Name: ALL UPPERCASE
    expect(onTextChange).toHaveBeenCalledWith(1, 'D');
  });

  it('typing in Title / Extra applies uppercase transformation', async () => {
    const onTextChange = vi.fn();
    render(<TextInputSection {...defaultProps} onTextChange={onTextChange} />);
    const user = userEvent.setup();

    const titleInput = screen.getByPlaceholderText('Title / Extra');
    await user.type(titleInput, 'e');

    // Title: ALL UPPERCASE
    expect(onTextChange).toHaveBeenCalledWith(2, 'E');
  });

  it('shows character counter', () => {
    render(
      <TextInputSection
        {...defaultProps}
        textLines={['Hello', '', '']}
      />,
    );
    expect(screen.getByText('5/20')).toBeInTheDocument();
  });

  it('inputs are disabled when isProcessing is true', () => {
    render(<TextInputSection {...defaultProps} isProcessing={true} />);
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('inputs are disabled when disabled prop is true', () => {
    render(<TextInputSection {...defaultProps} disabled={true} />);
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });
});
