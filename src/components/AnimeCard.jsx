import { Link } from 'react-router-dom';
import './AnimeCard.css';

function AnimeCard({ anime }) {
  return (
    <Link to={`/anime/${anime.id}`} className="anime-card">
      <div className="anime-card-image">
        <img src={anime.image} alt={anime.title} />
        <div className="anime-card-overlay">
          <div className="anime-card-rating">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>{anime.rating}</span>
          </div>
        </div>
      </div>
      <div className="anime-card-info">
        <h3 className="anime-card-title">{anime.title}</h3>
        <div className="anime-card-meta">
          <span>{anime.year}</span>
          {anime.episodes > 0 && (
            <>
              <span>•</span>
              <span>{anime.episodes} {anime.episodes === 1 ? 'episode' : 'episodes'}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default AnimeCard;

