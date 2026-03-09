import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ShareModal } from '../../src/components/ShareModal';

describe('ShareModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows generating state initially when mounted', () => {
    render(<ShareModal onClose={vi.fn()} shareUrl="https://example.com" />);
    expect(screen.getByTestId('share-generating')).toBeInTheDocument();
    expect(screen.getByText('Generating your share link...')).toBeInTheDocument();
  });

  it('transitions to ready state after delay and copies URL', async () => {
    render(<ShareModal onClose={vi.fn()} shareUrl="https://example.com?fn=Alice" />);

    expect(screen.getByTestId('share-generating')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByTestId('share-ready')).toBeInTheDocument();
    expect(screen.getByText('Link copied to clipboard!')).toBeInTheDocument();
    expect(screen.getByText('https://example.com?fn=Alice')).toBeInTheDocument();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com?fn=Alice');
  });

  it('closes on backdrop click', async () => {
    const onClose = vi.fn();
    render(<ShareModal onClose={onClose} shareUrl="https://example.com" />);

    await act(async () => {
      screen.getByTestId('share-modal-backdrop').click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on X button click', async () => {
    const onClose = vi.fn();
    render(<ShareModal onClose={onClose} shareUrl="https://example.com" />);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    await act(async () => {
      closeButton.click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('resets to generating state when remounted', async () => {
    const { unmount } = render(
      <ShareModal onClose={vi.fn()} shareUrl="https://example.com" />
    );

    // Advance to ready state
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByTestId('share-ready')).toBeInTheDocument();

    // Unmount and remount — simulates parent toggling showShareModal
    unmount();
    render(<ShareModal onClose={vi.fn()} shareUrl="https://example.com" />);
    expect(screen.getByTestId('share-generating')).toBeInTheDocument();
  });

  it('handles clipboard API failure gracefully', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Not allowed')) },
    });

    render(<ShareModal onClose={vi.fn()} shareUrl="https://example.com" />);

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByTestId('share-ready')).toBeInTheDocument();
  });
});
