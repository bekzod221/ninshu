import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAnimeById, fetchAnimeVideos, transformAnimeData, groupVideosByDubbing } from '../services/api';
import './Detail.css';

function Detail() {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [videos, setVideos] = useState([]);
  const [groupedVideos, setGroupedVideos] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDubbing, setSelectedDubbing] = useState(null);

  useEffect(() => {
    const loadAnime = async () => {
      setLoading(true);
      try {
        const apiAnime = await fetchAnimeById(id);
        if (apiAnime) {
          // Load videos first to get episode count
          const videoList = await fetchAnimeVideos(id);
          setVideos(videoList);
          
          const grouped = groupVideosByDubbing(videoList);
          setGroupedVideos(grouped);
          
          // Set default dubbing (first one)
          const dubbingKeys = Object.keys(grouped);
          const episodeCount = dubbingKeys.length > 0 ? grouped[dubbingKeys[0]].length : 0;
          
          const transformed = transformAnimeData(apiAnime, episodeCount);
          setAnime(transformed);
          
          if (dubbingKeys.length > 0) {
            setSelectedDubbing(dubbingKeys[0]);
          }
        } else {
          setAnime(null);
        }
      } catch (error) {
        console.error('Error loading anime:', error);
        setAnime(null);
      } finally {
        setLoading(false);
      }
    };

    loadAnime();
  }, [id]);


  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading anime details...</p>
        </div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="detail-error">
        <h1>Anime not found</h1>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    );
  }

  const currentEpisodes = selectedDubbing ? groupedVideos[selectedDubbing] || [] : [];

  return (
    <div className="detail-page">
      {/* Banner Section */}
      <div 
        className="detail-banner"
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(10, 10, 15, 0.8), rgba(10, 10, 15, 0.95)), url(${anime.banner})` }}
      >
        <div className="container">
          <div className="detail-banner-content">
            <div className="detail-poster">
              <img src={anime.image} alt={anime.title} />
            </div>
            <div className="detail-info">
              <h1 className="detail-title">{anime.title}</h1>
              {anime.titleJapanese && (
                <p className="detail-title-japanese">{anime.titleJapanese}</p>
              )}
              
              <div className="detail-meta-row">
                <div className="detail-rating">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="rating-value">{anime.rating.toFixed(1)}</span>
                  <span className="rating-max">/ 10</span>
                </div>
                <div className="detail-stats">
                  <div className="stat-item">
                    <span className="stat-label">Year</span>
                    <span className="stat-value">{anime.year}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Status</span>
                    <span className="stat-value">{anime.status}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Episodes</span>
                    <span className="stat-value">{currentEpisodes.length || 'N/A'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Views</span>
                    <span className="stat-value">{anime.views.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="detail-genres">
                {anime.genres.map((genre, index) => (
                  <span key={index} className="genre-badge">{genre}</span>
                ))}
              </div>

              <div className="detail-actions">
                {currentEpisodes.length > 0 && (
                  <Link 
                    to={`/watch/${id}/${currentEpisodes[0].video_id}`} 
                    className="btn btn-primary btn-large"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Watch Now
                  </Link>
                )}
                <button className="btn btn-secondary btn-large">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                  Add to List
                </button>
                <button className="btn btn-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container">
        <div className="detail-content">
          {/* Left Column */}
          <div className="detail-main">
            <section className="detail-section">
              <h2 className="section-heading">Synopsis</h2>
              <p className="detail-description">{anime.longDescription || anime.description}</p>
            </section>

            {/* Episodes Section */}
            {Object.keys(groupedVideos).length > 0 && (
              <section className="detail-section">
                <h2 className="section-heading">Episodes</h2>
                
                {/* Dubbing Selector */}
                {Object.keys(groupedVideos).length > 1 && (
                  <div className="dubbing-selector">
                    {Object.keys(groupedVideos).map((dubbing) => (
                      <button
                        key={dubbing}
                        className={`dubbing-btn ${selectedDubbing === dubbing ? 'active' : ''}`}
                        onClick={() => setSelectedDubbing(dubbing)}
                      >
                        {dubbing}
                      </button>
                    ))}
                  </div>
                )}

                {/* Episodes Grid */}
                <div className="episodes-grid">
                  {currentEpisodes.map((video) => (
                    <Link
                      key={video.video_id}
                      to={`/watch/${id}/${video.video_id}`}
                      className="episode-card"
                    >
                      <div className="episode-number">
                        Episode {video.number}
                      </div>
                      <div className="episode-info">
                        <div className="episode-duration">
                          {video.duration > 0 && (
                            <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                          )}
                        </div>
                        <div className="episode-views">
                          {video.views} views
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="detail-sidebar">
            <section className="sidebar-section">
              <h3 className="sidebar-heading">Information</h3>
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Type</span>
                  <span className="info-value">{anime.type || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Year</span>
                  <span className="info-value">{anime.year}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value">{anime.status}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Episodes</span>
                  <span className="info-value">{currentEpisodes.length || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Rating</span>
                  <span className="info-value">{anime.rating.toFixed(1)}/10</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Age Rating</span>
                  <span className="info-value">{anime.minAge || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Views</span>
                  <span className="info-value">{anime.views.toLocaleString()}</span>
                </div>
              </div>
            </section>

            <section className="sidebar-section">
              <h3 className="sidebar-heading">Genres</h3>
              <div className="genres-list">
                {anime.genres.map((genre, index) => (
                  <span key={index} className="genre-link">
                    {genre}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Detail;
