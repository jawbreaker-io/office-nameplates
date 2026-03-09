import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ShareModal } from '../../src/components/ShareModal';

describe('ShareModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows generating state initially when mounted', () => {
    render(<ShareModal onClose={vi.fn()} shareUrl="https://example.com" copied={true} />);
    expect(screen.getByTestId('share-generating')).toBeInTheDocument();
    expect(screen.getByText('Generating your share link...')).toBeInTheDocument();
  });

  it('transitions to ready state after delay and shows URL', async () => {
    render(<ShareModal onClose={vi.fn()} shareUrl="https://example.com?fn=Alice" copied={true} />);

    expect(screen.getByTestId('share-generating')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByTestId('share-ready')).toBeInTheDocument();
    expect(screen.getByText(/Link copied to clipboard/)).toBeInTheDocument();
    expect(screen.getByText('https://example.com?fn=Alice')).toBeInTheDocument();
  });

  it('shows fallback message when copy failed', async () => {
    render(<ShareModal onClose={vi.fn()} shareUrl="https://example.com" copied={false} />);

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText(/Your share link is ready/)).toBeInTheDocument();
    expect(screen.queryByText(/copied to clipboard/)).not.toBeInTheDocument();
  });

  it('closes on backdrop click', async () => {
    const onClose = vi.fn();
    render(<ShareModal onClose={onClose} shareUrl="https://example.com" copied={true} />);

    await act(async () => {
      screen.getByTestId('share-modal-backdrop').click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on X button click', async () => {
    const onClose = vi.fn();
    render(<ShareModal onClose={onClose} shareUrl="https://example.com" copied={true} />);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    await act(async () => {
      closeButton.click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('resets to generating state when remounted', async () => {
    const { unmount } = render(
      <ShareModal onClose={vi.fn()} shareUrl="https://example.com" copied={true} />
    );

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByTestId('share-ready')).toBeInTheDocument();

    unmount();
    render(<ShareModal onClose={vi.fn()} shareUrl="https://example.com" copied={true} />);
    expect(screen.getByTestId('share-generating')).toBeInTheDocument();
  });
});
