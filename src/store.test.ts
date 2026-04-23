import { describe, it, expect, beforeEach } from 'vitest';
import { useLibraryStore, useUIStore } from './store';

describe('Library Store', () => {
  beforeEach(() => {
    // Reset state before each test
    useLibraryStore.setState({ comics: [], isLoading: true, error: null });
  });

  it('should initialize with empty comics', () => {
    const state = useLibraryStore.getState();
    expect(state.comics).toEqual([]);
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should set comics and update loading state', () => {
    const testComics = [
      { id: 1, title: 'Test 1', issue_number: '1', series_name: 'Test', publisher: 'Pub', file_path: '/a.cbz' }
    ];
    useLibraryStore.getState().setComics(testComics);
    
    const state = useLibraryStore.getState();
    expect(state.comics).toEqual(testComics);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set error state', () => {
    useLibraryStore.getState().setError('Failed to load');
    
    const state = useLibraryStore.getState();
    expect(state.error).toBe('Failed to load');
    expect(state.isLoading).toBe(false);
  });
});

describe('UI Store', () => {
  beforeEach(() => {
    useUIStore.setState({
      apiPort: null,
      activePublisher: null,
      searchQuery: '',
      libraryPath: null,
      isImporting: false
    });
  });

  it('should set api port', () => {
    useUIStore.getState().setApiPort(8080);
    expect(useUIStore.getState().apiPort).toBe(8080);
  });

  it('should set active publisher', () => {
    useUIStore.getState().setActivePublisher('Marvel');
    expect(useUIStore.getState().activePublisher).toBe('Marvel');
  });
});
