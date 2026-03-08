import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  readFileAsArrayBuffer,
  downloadBlob,
  isValidSTLFile,
  isValidSVGFile,
  isFileSizeValid,
} from '../../src/utils/fileHelpers';

describe('fileHelpers', () => {
  describe('readFileAsArrayBuffer', () => {
    it('returns ArrayBuffer from File', async () => {
      const content = new Uint8Array([1, 2, 3, 4]);
      const file = new File([content], 'test.bin');
      const result = await readFileAsArrayBuffer(file);

      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBe(4);
    });
  });

  describe('downloadBlob', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('creates anchor element, clicks it, and cleans up', () => {
      const clickSpy = vi.fn();
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        // Spy on click
        (node as HTMLAnchorElement).click = clickSpy;
        return node;
      });
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      const revokeURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      const blob = new Blob(['test'], { type: 'text/plain' });
      downloadBlob(blob, 'test.txt');

      expect(appendSpy).toHaveBeenCalledOnce();
      expect(clickSpy).toHaveBeenCalledOnce();
      expect(removeSpy).toHaveBeenCalledOnce();
      expect(revokeURLSpy).toHaveBeenCalledOnce();
    });
  });

  describe('isValidSTLFile', () => {
    it('returns true for .stl file', () => {
      const file = new File([], 'model.stl');
      expect(isValidSTLFile(file)).toBe(true);
    });

    it('returns true for .STL file (case insensitive)', () => {
      const file = new File([], 'model.STL');
      expect(isValidSTLFile(file)).toBe(true);
    });

    it('returns false for non-.stl file', () => {
      const file = new File([], 'model.obj');
      expect(isValidSTLFile(file)).toBe(false);
    });
  });

  describe('isValidSVGFile', () => {
    it('returns true for .svg file', () => {
      const file = new File([], 'logo.svg');
      expect(isValidSVGFile(file)).toBe(true);
    });

    it('returns false for non-.svg file', () => {
      const file = new File([], 'logo.png');
      expect(isValidSVGFile(file)).toBe(false);
    });
  });

  describe('isFileSizeValid', () => {
    it('returns true for file under 50MB', () => {
      const file = new File([new ArrayBuffer(1000)], 'small.stl');
      expect(isFileSizeValid(file)).toBe(true);
    });

    it('returns false for file over 50MB', () => {
      // Create a mock with large size
      const file = new File([], 'huge.stl');
      Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024 });
      expect(isFileSizeValid(file)).toBe(false);
    });
  });
});
