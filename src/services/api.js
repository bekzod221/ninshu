const API_BASE_URL = 'https://site.yummyani.me/api';

/**
 * Get protocol-relative URL with https
 */
const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
};

/**
 * Fetch anime list from API
 */
export const fetchAnimeList = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/anime/`);
    const data = await response.json();
    return data.response || [];
  } catch (error) {
    console.error('Error fetching anime list:', error);
    return [];
  }
};

/**
 * Fetch anime details by ID
 */
export const fetchAnimeById = async (animeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/anime/${animeId}`);
    const data = await response.json();
    
    // Check for API errors
    if (data.error) {
      console.error('API Error:', data.error);
      return null;
    }
    
    // The response is { response: { ...anime data } }
    return data.response || null;
  } catch (error) {
    console.error('Error fetching anime:', error);
    return null;
  }
};

/**
 * Fetch videos/episodes for an anime
 */
export const fetchAnimeVideos = async (animeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/anime/${animeId}/videos`);
    const data = await response.json();
    return data.response || [];
  } catch (error) {
    console.error('Error fetching anime videos:', error);
    return [];
  }
};

/**
 * Search anime by query
 * Note: API limit is 0-30
 */
export const searchAnime = async (query, limit = 20, offset = 0) => {
  try {
    const encodedQuery = encodeURIComponent(query);
    // Ensure limit is within API constraints (0-30)
    const validLimit = Math.min(Math.max(limit, 1), 30);
    const response = await fetch(`${API_BASE_URL}/search?q=${encodedQuery}&limit=${validLimit}&offset=${offset}`);
    const data = await response.json();
    
    // Check for API errors
    if (data.error) {
      console.error('API Error:', data.error);
      return [];
    }
    
    return data.response || [];
  } catch (error) {
    console.error('Error searching anime:', error);
    return [];
  }
};

/**
 * Transform API anime data to our component format
 */
export const transformAnimeData = (apiAnime, episodeCount = 0) => {
  if (!apiAnime) return null;

  return {
    id: apiAnime.anime_id,
    title: apiAnime.title,
    titleJapanese: '', // Not in API, could be extracted from description or left empty
    description: apiAnime.description || '',
    longDescription: apiAnime.description || '',
    image: getImageUrl(apiAnime.poster?.huge || apiAnime.poster?.big || apiAnime.poster?.medium || apiAnime.poster?.small),
    banner: getImageUrl(apiAnime.poster?.mega || apiAnime.poster?.fullsize || apiAnime.poster?.huge),
    rating: apiAnime.rating?.average || 0,
    year: apiAnime.year || 0,
    status: apiAnime.anime_status?.title || 'Unknown',
    episodes: episodeCount,
    genres: apiAnime.genres?.map(g => g.title) || [],
    studios: [], // Not in API
    duration: '24 min', // Default, could be calculated from video duration
    season: apiAnime.season?.toString() || '',
    animeUrl: apiAnime.anime_url,
    views: apiAnime.views || 0,
    type: apiAnime.type?.name || '',
    minAge: apiAnime.min_age?.title || '',
    // Keep original API data for reference
    original: apiAnime
  };
};

/**
 * Player priority (higher number = better priority)
 * CVH is typically ad-free and newer, so highest priority
 */
const PLAYER_PRIORITY = {
  // 'Плеер CVH': 0,
  // 'CVH': 0,
  'Плеер Alloha': 5,
  'Alloha': 5,
  'Плеер Kodik': 3,
  'Kodik': 3,
  'Плеер Aksor': 4,
  'Aksor': 4,
};

/**
 * Get player priority (higher is better)
 */
const getPlayerPriority = (player) => {
  return PLAYER_PRIORITY[player] || 0;
};

/**
 * Filter videos to show only one episode per episode number
 * Prioritizes better players (ad-free, reliable)
 * @param {Array} videos - Array of video objects
 * @param {number|string} [animeId] - Optional anime ID for special cases
 */
export const filterVideosByBestPlayer = (videos, animeId = null) => {
  // Special case: One Piece (ID 1512) always uses Kodik player
  let videosToProcess = videos;
  if (animeId && (animeId === 1512 || animeId === '1512')) {
    videosToProcess = videos.filter(video => {
      const player = video.data?.player || '';
      return player === 'Плеер Kodik' || player === 'Kodik';
    });
    // If no Kodik videos found, fall back to all videos
    if (videosToProcess.length === 0) {
      videosToProcess = videos;
    }
  }
  
  // Group by episode number
  const episodesMap = new Map();
  
  videosToProcess.forEach(video => {
    const episodeNum = video.number || '0';
    const player = video.data?.player || 'Unknown';
    
    if (!episodesMap.has(episodeNum)) {
      episodesMap.set(episodeNum, []);
    }
    episodesMap.get(episodeNum).push(video);
  });
  
  // For each episode, select the best video based on player priority
  const filteredVideos = [];
  
  episodesMap.forEach((videosForEpisode) => {
    // Sort by player priority (highest first), then by views (most viewed first)
    videosForEpisode.sort((a, b) => {
      const priorityA = getPlayerPriority(a.data?.player || '');
      const priorityB = getPlayerPriority(b.data?.player || '');
      
      if (priorityB !== priorityA) {
        return priorityB - priorityA; // Higher priority first
      }
      
      // If same priority, prefer more views
      return (b.views || 0) - (a.views || 0);
    });
    
    // Take the best one (first after sorting)
    if (videosForEpisode.length > 0) {
      filteredVideos.push(videosForEpisode[0]);
    }
  });
  
  // Sort by episode number
  filteredVideos.sort((a, b) => {
    const numA = parseInt(a.number) || 0;
    const numB = parseInt(b.number) || 0;
    return numA - numB;
  });
  
  return filteredVideos;
};

/**
 * Group videos by dubbing/translation (with filtered videos - one per episode)
 * @param {Array} videos - Array of video objects
 * @param {number|string} [animeId] - Optional anime ID for special cases
 */
export const groupVideosByDubbing = (videos, animeId = null) => {
  // First filter to get best player per episode
  const filteredVideos = filterVideosByBestPlayer(videos, animeId);
  
  const grouped = {};
  
  filteredVideos.forEach(video => {
    const key = video.data?.dubbing || 'Unknown';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(video);
  });

  // Sort episodes within each group
  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });
  });

  return grouped;
};

export { getImageUrl };

