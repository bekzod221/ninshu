import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAnime, transformAnimeData } from '../services/api';
import AnimeCard from '../components/AnimeCard';
import './Search.css';

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const performSearch = async (searchQuery) => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      try {
        const results = await searchAnime(searchQuery, 30, 0);
        const transformed = results.map(transformAnimeData).filter(Boolean);
        setSearchResults(transformed);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    if (query.trim()) {
      performSearch(query);
    } else {
      setSearchResults([]);
      setHasSearched(false);
      setLoading(false);
    }
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const searchQuery = formData.get('search') || '';
    setSearchParams({ q: searchQuery });
  };

  return (
    <div className="search-page">
      <div className="container">
        <div className="search-header">
          <h1 className="search-title">Search Anime</h1>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              name="search"
              className="search-input"
              placeholder="Search for anime..."
              defaultValue={query}
              autoFocus
            />
            <button type="submit" className="search-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Search
            </button>
          </form>
        </div>

        {loading && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
            <p>Searching...</p>
          </div>
        )}

        {!loading && hasSearched && (
          <>
            <div className="search-results-header">
              <h2 className="results-title">
                {searchResults.length > 0
                  ? `Found ${searchResults.length} result${searchResults.length === 1 ? '' : 's'} for "${query}"`
                  : `No results found for "${query}"`}
              </h2>
            </div>

            {searchResults.length > 0 ? (
              <div className="search-results-grid">
                {searchResults.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <h3>No anime found</h3>
                <p>Try a different search term</p>
              </div>
            )}
          </>
        )}

        {!loading && !hasSearched && (
          <div className="search-placeholder">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <h3>Search for your favorite anime</h3>
            <p>Enter a title in the search box above</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;

