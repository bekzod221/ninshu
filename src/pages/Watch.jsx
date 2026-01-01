import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAnimeById, fetchAnimeVideos, transformAnimeData, groupVideosByDubbing, filterVideosByBestPlayer } from '../services/api';
import './Watch.css';

function Watch() {
  const { id, videoId } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState(null);
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDubbing, setSelectedDubbing] = useState(null);
  const [groupedVideos, setGroupedVideos] = useState({});

  useEffect(() => {
    // Fix for fullscreen exit causing page reload
    // The issue is that some browsers trigger navigation on fullscreen exit
    // We prevent this by ensuring the URL stays the same
    const handleFullscreenChange = () => {
      // Small delay to ensure the event has fully processed
      setTimeout(() => {
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) {
          // Exiting fullscreen - ensure URL doesn't change
          const currentUrl = window.location.href;
          if (window.location.href !== currentUrl) {
            window.history.replaceState(null, '', currentUrl);
          }
        }
      }, 0);
    };

    // Add event listeners for all browser prefixes
    document.addEventListener('fullscreenchange', handleFullscreenChange, { passive: true });
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange, { passive: true });
    document.addEventListener('mozfullscreenchange', handleFullscreenChange, { passive: true });
    document.addEventListener('MSFullscreenChange', handleFullscreenChange, { passive: true });

    const loadData = async () => {
      setLoading(true);
      try {
        const apiAnime = await fetchAnimeById(id);
        if (apiAnime) {
          const transformed = transformAnimeData(apiAnime);
          setAnime(transformed);

          const videoList = await fetchAnimeVideos(id);
          // Filter to get best player per episode
          const filteredVideos = filterVideosByBestPlayer(videoList);
          setVideos(filteredVideos);
          
          // Group filtered videos by dubbing
          const grouped = groupVideosByDubbing(filteredVideos);
          setGroupedVideos(grouped);
          
          // Find current video from filtered list
          const video = filteredVideos.find(v => v.video_id === parseInt(videoId));
          if (video) {
            setCurrentVideo(video);
            setSelectedDubbing(video.data?.dubbing || Object.keys(grouped)[0]);
          } else if (filteredVideos.length > 0) {
            // If video not found, use first video from filtered list
            const firstVideo = filteredVideos[0];
            setCurrentVideo(firstVideo);
            setSelectedDubbing(firstVideo.data?.dubbing || Object.keys(grouped)[0]);
            navigate(`/watch/${id}/${firstVideo.video_id}`, { replace: true });
          }
        }
      } catch (error) {
        console.error('Error loading watch data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [id, videoId, navigate]);

  const getIframeUrl = (video) => {
    if (!video?.iframe_url) return '';
    if (video.iframe_url.startsWith('//')) {
      return `https:${video.iframe_url}`;
    }
    return video.iframe_url;
  };

  const handleEpisodeChange = (newVideoId) => {
    navigate(`/watch/${id}/${newVideoId}`);
    window.scrollTo(0, 0);
  };

  const getNextEpisode = () => {
    if (!currentVideo || !selectedDubbing) return null;
    const episodes = groupedVideos[selectedDubbing] || [];
    const currentIndex = episodes.findIndex(v => v.video_id === currentVideo.video_id);
    if (currentIndex < episodes.length - 1) {
      return episodes[currentIndex + 1];
    }
    return null;
  };

  const getPrevEpisode = () => {
    if (!currentVideo || !selectedDubbing) return null;
    const episodes = groupedVideos[selectedDubbing] || [];
    const currentIndex = episodes.findIndex(v => v.video_id === currentVideo.video_id);
    if (currentIndex > 0) {
      return episodes[currentIndex - 1];
    }
    return null;
  };

  if (loading) {
    return (
      <div className="watch-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading player...</p>
        </div>
      </div>
    );
  }

  if (!anime || !currentVideo) {
    return (
      <div className="watch-page">
        <div className="error-container">
          <h2>Video not found</h2>
          <Link to={`/anime/${id}`} className="btn btn-primary">Back to Anime</Link>
        </div>
      </div>
    );
  }

  const currentEpisodes = selectedDubbing ? groupedVideos[selectedDubbing] || [] : [];
  const nextEpisode = getNextEpisode();
  const prevEpisode = getPrevEpisode();
  const iframeUrl = getIframeUrl(currentVideo);

  return (
    <div className="watch-page">
      {/* Header */}
      <div className="watch-header">
        <div className="container">
          <Link to={`/anime/${id}`} className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to {anime.title}
          </Link>
        </div>
      </div>

      {/* Player Section */}
      <div className="container">
        <div className="watch-content">
          {/* Main Player */}
          <div className="player-section">
            <div className="video-player-container">
              {iframeUrl ? (
                <iframe
                  src={iframeUrl}
                  className="video-player"
                  frameBorder="0"
                  allowFullScreen
                  title={`${anime.title} - Episode ${currentVideo.number}`}
                  allow="fullscreen; autoplay; picture-in-picture"
                />
              ) : (
                <div className="player-placeholder">
                  <p>Video player not available</p>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="video-info">
              <h1 className="video-title">
                {anime.title} - Episode {currentVideo.number}
              </h1>
              <div className="video-meta">
                <span>Duration: {currentVideo.duration > 0 ? `${Math.floor(currentVideo.duration / 60)}:${(currentVideo.duration % 60).toString().padStart(2, '0')}` : 'N/A'}</span>
                <span>•</span>
                <span>{currentVideo.views} views</span>
                {currentVideo.data?.dubbing && (
                  <>
                    <span>•</span>
                    <span>{currentVideo.data.dubbing}</span>
                  </>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="episode-navigation">
              {prevEpisode && (
                <button
                  className="nav-btn nav-btn-prev"
                  onClick={() => handleEpisodeChange(prevEpisode.video_id)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Previous Episode
                </button>
              )}
              {nextEpisode && (
                <button
                  className="nav-btn nav-btn-next"
                  onClick={() => handleEpisodeChange(nextEpisode.video_id)}
                >
                  Next Episode
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Episodes Sidebar */}
          <div className="episodes-sidebar">
            <h3 className="episodes-sidebar-title">Episodes</h3>
            
            {/* Dubbing Selector */}
            {Object.keys(groupedVideos).length > 1 && (
              <div className="dubbing-selector">
                {Object.keys(groupedVideos).map((dubbing) => (
                  <button
                    key={dubbing}
                    className={`dubbing-btn ${selectedDubbing === dubbing ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDubbing(dubbing);
                      const firstEpisode = groupedVideos[dubbing][0];
                      if (firstEpisode) {
                        handleEpisodeChange(firstEpisode.video_id);
                      }
                    }}
                  >
                    {dubbing}
                  </button>
                ))}
              </div>
            )}

            {/* Episodes List */}
            <div className="episodes-list">
              {currentEpisodes.map((video) => (
                <button
                  key={video.video_id}
                  className={`episode-item ${currentVideo.video_id === video.video_id ? 'active' : ''}`}
                  onClick={() => handleEpisodeChange(video.video_id)}
                >
                  <span className="episode-item-number">Episode {video.number}</span>
                  {video.duration > 0 && (
                    <span className="episode-item-duration">
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Watch;

