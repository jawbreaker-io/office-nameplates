import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ControlPanel } from '../../src/components/ControlPanel';
import { buildShareUrl } from '../../src/utils/shareUrl';
import { DEFAULT_STATE } from '../../src/engine/types';

describe('ControlPanel', () => {
  const mockEngine = {
    state: { ...DEFAULT_STATE },
    setTextLine: vi.fn(),
    setTextBox: vi.fn(),
    generateFinalMesh: vi.fn(),
  };

  it('renders all sub-sections', () => {
    render(<ControlPanel engine={mockEngine} />);

    expect(screen.getByText('Nameplate Generator')).toBeInTheDocument();
    expect(screen.getByText('Name Text')).toBeInTheDocument();
    expect(screen.getByText('Share Nameplate')).toBeInTheDocument();
    expect(screen.getByText('Download Files')).toBeInTheDocument();
    // Download buttons are hidden by default
    expect(screen.queryByText('Download 3MF')).not.toBeInTheDocument();
    expect(screen.queryByText('STL')).not.toBeInTheDocument();
  });

  it('reveals download buttons when Download Files is clicked', async () => {
    render(<ControlPanel engine={mockEngine} />);

    expect(screen.queryByText('Download 3MF')).not.toBeInTheDocument();

    await act(async () => {
      screen.getByText('Download Files').click();
    });

    expect(screen.getByText('Download 3MF')).toBeInTheDocument();
    expect(screen.getByText('STL')).toBeInTheDocument();
  });

  it('disables text inputs when no base STL loaded', () => {
    render(<ControlPanel engine={mockEngine} />);

    const textInputs = screen.getAllByRole('textbox');
    textInputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('disables export buttons when no base STL loaded', async () => {
    render(<ControlPanel engine={mockEngine} />);

    // Expand download section first
    await act(async () => {
      screen.getByText('Download Files').click();
    });

    const exportButtons = screen.getAllByRole('button').filter(
      (btn) => btn.textContent === 'Download 3MF' || btn.textContent === 'STL'
    );
    exportButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('keeps share button enabled regardless of base STL state', () => {
    render(<ControlPanel engine={mockEngine} />);

    const shareButton = screen.getByText('Share Nameplate').closest('button')!;
    expect(shareButton).not.toBeDisabled();
  });

  it('opens share modal when share button is clicked', async () => {
    render(<ControlPanel engine={mockEngine} />);

    const shareButton = screen.getByText('Share Nameplate').closest('button')!;
    await act(async () => {
      shareButton.click();
    });

    expect(screen.getByText('Generating your share link...')).toBeInTheDocument();
  });
});

describe('buildShareUrl', () => {
  /** Parse the query params back from a built URL — simulates what PreviewPanel does on load */
  function roundTrip(textLines: [string, string, string]) {
    const url = buildShareUrl(textLines);
    const params = new URL(url).searchParams;
    return {
      url,
      fn: params.get('fn'),
      ln: params.get('ln'),
      t: params.get('t'),
    };
  }

  it('encodes basic ASCII names', () => {
    const { fn, ln, t } = roundTrip(['James', 'RICHARDSON', '']);
    expect(fn).toBe('James');
    expect(ln).toBe('RICHARDSON');
    expect(t).toBeNull(); // empty string omitted
  });

  it('omits empty fields from query string', () => {
    const { url } = roundTrip(['Alice', '', '']);
    expect(url).toContain('fn=Alice');
    expect(url).not.toContain('ln=');
    expect(url).not.toContain('t=');
  });

  it('omits all params when all fields are empty', () => {
    const { url } = roundTrip(['', '', '']);
    expect(url).not.toContain('?');
  });

  it('encodes names with spaces', () => {
    const { fn, ln } = roundTrip(['Mary Jane', 'VAN DER BERG', '']);
    expect(fn).toBe('Mary Jane');
    expect(ln).toBe('VAN DER BERG');
  });

  it('encodes names with numbers', () => {
    const { fn, t } = roundTrip(['John3', 'SMITH', 'ROOM 42']);
    expect(fn).toBe('John3');
    expect(t).toBe('ROOM 42');
  });

  it('encodes names with periods', () => {
    const { fn, t } = roundTrip(['J.R.', 'TOLKIEN', 'DR.']);
    expect(fn).toBe('J.R.');
    expect(t).toBe('DR.');
  });

  it('encodes names with commas', () => {
    const { ln, t } = roundTrip(['Ana', 'LÓPEZ, JR.', 'SR.']);
    expect(ln).toBe('LÓPEZ, JR.');
    expect(t).toBe('SR.');
  });

  it('encodes accented Latin characters', () => {
    const { fn, ln } = roundTrip(['José', 'GARCÍA', '']);
    expect(fn).toBe('José');
    expect(ln).toBe('GARCÍA');
  });

  it('encodes umlauts and Nordic characters', () => {
    const { fn, ln } = roundTrip(['Björk', 'MÜLLER', '']);
    expect(fn).toBe('Björk');
    expect(ln).toBe('MÜLLER');
  });

  it('encodes Cyrillic characters', () => {
    const { fn, ln } = roundTrip(['Иван', 'ПЕТРОВ', '']);
    expect(fn).toBe('Иван');
    expect(ln).toBe('ПЕТРОВ');
  });

  it('encodes CJK characters', () => {
    const { fn, ln } = roundTrip(['太郎', '田中', '']);
    expect(fn).toBe('太郎');
    expect(ln).toBe('田中');
  });

  it('encodes Arabic characters', () => {
    const { fn, ln } = roundTrip(['أحمد', 'محمد', '']);
    expect(fn).toBe('أحمد');
    expect(ln).toBe('محمد');
  });

  it('encodes simple emoji', () => {
    const { t } = roundTrip(['Star', 'CODER', '⭐ DEV']);
    expect(t).toBe('⭐ DEV');
  });

  it('encodes emoji in all three fields', () => {
    const { fn, ln, t } = roundTrip(['🔥 Alex', '🚀 SMITH', '💻 ENG']);
    expect(fn).toBe('🔥 Alex');
    expect(ln).toBe('🚀 SMITH');
    expect(t).toBe('💻 ENG');
  });

  it('encodes ZWJ compound emoji (family, profession)', () => {
    const { fn, t } = roundTrip(['👨‍💻', 'CODE', '👩‍🔬 SCI']);
    expect(fn).toBe('👨‍💻');
    expect(t).toBe('👩‍🔬 SCI');
  });

  it('encodes flag emoji (regional indicator pairs)', () => {
    const { t } = roundTrip(['Pat', 'GLOBAL', '🇺🇸🇬🇧']);
    expect(t).toBe('🇺🇸🇬🇧');
  });

  it('encodes skin-tone modifier emoji', () => {
    const { fn } = roundTrip(['👋🏽 Hi', 'WAVE', '']);
    expect(fn).toBe('👋🏽 Hi');
  });

  it('encodes emoji-only fields', () => {
    const { fn, ln, t } = roundTrip(['😀', '🎉', '🏆']);
    expect(fn).toBe('😀');
    expect(ln).toBe('🎉');
    expect(t).toBe('🏆');
  });

  it('encodes multiple emoji in sequence', () => {
    const { t } = roundTrip(['Test', 'USER', '⚡🔧🛠️✨']);
    expect(t).toBe('⚡🔧🛠️✨');
  });

  it('encodes URL-special characters (& = ? # +)', () => {
    const { fn, ln, t } = roundTrip(['A&B', 'C=D', 'E?F#G+H']);
    expect(fn).toBe('A&B');
    expect(ln).toBe('C=D');
    expect(t).toBe('E?F#G+H');
  });

  it('encodes names with leading/trailing spaces', () => {
    const { fn } = roundTrip([' James ', 'SMITH', '']);
    expect(fn).toBe(' James ');
  });

  it('encodes names with apostrophes and hyphens', () => {
    const { fn, ln } = roundTrip(["O'Brien", "SAINT-CLAIR", '']);
    expect(fn).toBe("O'Brien");
    expect(ln).toBe('SAINT-CLAIR');
  });

  it('encodes slash and backslash', () => {
    const { t } = roundTrip(['Test', 'USER', 'A/B\\C']);
    expect(t).toBe('A/B\\C');
  });

  it('round-trips the maximum length field (20 chars)', () => {
    const long = 'ABCDEFGHIJKLMNOPQRST'; // exactly 20 chars
    const { fn } = roundTrip([long, '', '']);
    expect(fn).toBe(long);
    expect(fn).toHaveLength(20);
  });
});
