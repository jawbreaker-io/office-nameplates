import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyToClipboard } from '../../src/utils/clipboard';

describe('copyToClipboard', () => {
  beforeEach(() => {
    // Reset execCommand mock
    vi.restoreAllMocks();
  });

  it('uses navigator.clipboard.writeText when available', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    const ok = await copyToClipboard('hello');
    expect(ok).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when clipboard API fails', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    document.execCommand = vi.fn().mockReturnValue(true);

    const ok = await copyToClipboard('hello');
    expect(ok).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('falls back to execCommand when clipboard API is missing', async () => {
    Object.assign(navigator, { clipboard: undefined });
    document.execCommand = vi.fn().mockReturnValue(true);

    const ok = await copyToClipboard('hello');
    expect(ok).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('returns false when both approaches fail', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    document.execCommand = vi.fn().mockReturnValue(false);

    const ok = await copyToClipboard('hello');
    expect(ok).toBe(false);
  });
});
