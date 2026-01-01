import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAnimeList, transformAnimeData } from '../services/api';
import AnimeCard from '../components/AnimeCard';
import './Home.css';

function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);
  
  useEffect(() => {
    const loadAnime = async () => {
      setLoading(true);
      try {
        const apiAnimeList = await fetchAnimeList();
        const transformedList = apiAnimeList.map(transformAnimeData).filter(Boolean);
        
        // Extract unique categories
        const allGenres = new Set(['All']);
        transformedList.forEach(anime => {
          anime.genres.forEach(genre => allGenres.add(genre));
        });
        setCategories(Array.from(allGenres));
        
        setAnimeList(transformedList);
      } catch (error) {
        console.error('Error loading anime:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAnime();
  }, []);
  
  const featuredAnime = animeList[0];
  const popularAnime = [...animeList].sort((a, b) => b.rating - a.rating);
  const recentAnime = [...animeList].sort((a, b) => b.year - a.year);
  
  const filteredAnime = selectedCategory === 'All' 
    ? animeList 
    : animeList.filter(anime => anime.genres.includes(selectedCategory));

  if (loading) {
    return (
      <div className="home">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading anime...</p>
        </div>
      </div>
    );
  }

  if (!featuredAnime) {
    return (
      <div className="home">
        <div className="error-container">
          <h2>No anime found</h2>
          <p>Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero/Featured Section */}
      <section className="hero-section">
        <div 
          className="hero-background"
          style={{ backgroundImage: `linear-gradient(to right, rgba(10, 10, 15, 0.95), rgba(10, 10, 15, 0.7)), url(${featuredAnime.banner})` }}
        >
          <div className="hero-content">
            <h1 className="hero-title">{featuredAnime.title}</h1>
            <p className="hero-japanese">{featuredAnime.titleJapanese}</p>
            <p className="hero-description">{featuredAnime.description}</p>
            <div className="hero-info">
              <span className="hero-rating">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {featuredAnime.rating}
              </span>
              <span>{featuredAnime.year}</span>
              <span>•</span>
              <span>{featuredAnime.views.toLocaleString()} Views</span>
              <span>•</span>
              <span>{featuredAnime.status}</span>
            </div>
            <div className="hero-actions">
              <Link to={`/anime/${featuredAnime.id}`} className="btn btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Watch Now
              </Link>
              <button className="btn btn-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                Add to List
              </button>
            </div>
            <div className="hero-genres">
              {featuredAnime.genres.map((genre, index) => (
                <span key={index} className="genre-tag">{genre}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <div className="container">
          <div className="categories-filter">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Section */}
      <section className="anime-section">
        <div className="container">
          <h2 className="section-title">Popular This Season</h2>
          <div className="anime-grid">
            {popularAnime.slice(0, 6).map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        </div>
      </section>

      {/* Recent Releases */}
      <section className="anime-section">
        <div className="container">
          <h2 className="section-title">Recent Releases</h2>
          <div className="anime-grid">
            {recentAnime.slice(0, 6).map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        </div>
      </section>

      {/* All Anime */}
      <section className="anime-section">
        <div className="container">
          <h2 className="section-title">
            {selectedCategory === 'All' ? 'All Anime' : `${selectedCategory} Anime`}
          </h2>
          <div className="anime-grid">
            {filteredAnime.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

