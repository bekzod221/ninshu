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
 * Check if a player has a complete episode list (no gaps)
 * A player is considered to have a complete list if there are no gaps in the episode sequence
 * @param {Array} playerVideos - Videos from a single player
 * @returns {boolean} - True if episode list has no gaps
 */
const hasCompleteEpisodeList = (playerVideos) => {
  if (playerVideos.length === 0) return false;
  
  // Extract unique episode numbers and sort them
  const episodeSet = new Set();
  playerVideos.forEach(video => {
    const episodeNum = parseInt(video.number) || 0;
    if (episodeNum > 0) {
      episodeSet.add(episodeNum);
    }
  });
  
  if (episodeSet.size === 0) return false;
  if (episodeSet.size === 1) return true; // Single episode is considered complete
  
  // Convert to sorted array
  const episodeNumbers = Array.from(episodeSet).sort((a, b) => a - b);
  
  // Check for gaps: if there's any gap in the sequence, it's incomplete
  for (let i = 0; i < episodeNumbers.length - 1; i++) {
    if (episodeNumbers[i + 1] - episodeNumbers[i] > 1) {
      // Found a gap - player is missing at least one episode
      return false;
    }
  }
  
  // No gaps found - player has a continuous episode list
  return true;
};

/**
 * Filter videos to show only one episode per episode number
 * Prioritizes better players (ad-free, reliable) that have complete episode lists
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
  
  // Group videos by player
  const videosByPlayer = new Map();
  
  videosToProcess.forEach(video => {
    const player = video.data?.player || 'Unknown';
    if (!videosByPlayer.has(player)) {
      videosByPlayer.set(player, []);
    }
    videosByPlayer.get(player).push(video);
  });
  
  // Check each player for complete episode list and calculate priority
  const playerScores = [];
  
  videosByPlayer.forEach((playerVideos, player) => {
    const hasComplete = hasCompleteEpisodeList(playerVideos);
    const priority = getPlayerPriority(player);
    
    playerScores.push({
      player,
      videos: playerVideos,
      hasComplete,
      priority,
      episodeCount: playerVideos.length
    });
  });
  
  // Filter to only players with complete episode lists
  const completePlayers = playerScores.filter(p => p.hasComplete);
  
  // If no player has complete list, fall back to all players (prioritized)
  const playersToConsider = completePlayers.length > 0 ? completePlayers : playerScores;
  
  // Sort by priority (highest first), then by episode count (most episodes first)
  playersToConsider.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority; // Higher priority first
    }
    return b.episodeCount - a.episodeCount; // More episodes first
  });
  
  // Select the best player
  if (playersToConsider.length === 0) {
    return [];
  }
  
  const bestPlayer = playersToConsider[0];
  
  // Group by episode number and select one video per episode (prefer most viewed)
  const episodeMap = new Map();
  bestPlayer.videos.forEach(video => {
    const episodeNum = video.number || '0';
    if (!episodeMap.has(episodeNum)) {
      episodeMap.set(episodeNum, video);
    } else {
      // If multiple videos for same episode, prefer the one with more views
      const existing = episodeMap.get(episodeNum);
      if ((video.views || 0) > (existing.views || 0)) {
        episodeMap.set(episodeNum, video);
      }
    }
  });
  
  // Convert map to array and sort by episode number
  const selectedVideos = Array.from(episodeMap.values());
  selectedVideos.sort((a, b) => {
    const numA = parseInt(a.number) || 0;
    const numB = parseInt(b.number) || 0;
    return numA - numB;
  });
  
  return selectedVideos;
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

