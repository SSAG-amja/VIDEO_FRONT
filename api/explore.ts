import client from './client';

type SortOrder = 'latest' | 'likes' | 'rating';
export const SEARCH_PAGE_SIZE = 20;

const posterUrl = (posterPath?: string | null, fallbackSize = '500x750') => {
  if (!posterPath) {
    return `https://via.placeholder.com/${fallbackSize}?text=No+Image`;
  }
  return posterPath.startsWith('http')
    ? posterPath
    : `https://image.tmdb.org/t/p/w500${posterPath}`;
};

const toMovieCard = (movie: any) => {
  const posterPath = movie.poster_path ?? movie.posterPath ?? null;
  return {
    id: String(movie.movie_id ?? movie.tmdb_id ?? movie.id),
    title: movie.movie_title ?? movie.title_ko ?? movie.title ?? '',
    image: movie.image ?? posterUrl(posterPath),
    poster_path: posterPath,
    posterPath,
    rating: movie.vote_average ?? movie.rating ?? 0,
    badge: movie.badge ?? null,
  };
};

export const fetchSearchData = async (
  query: string,
  sort: SortOrder = 'latest',
  page: number = 1,
  limit: number = SEARCH_PAGE_SIZE
) => {
  try {
    const response = await client.get('/api/v1/explore/movies/search', {
      params: {
        query,
        skip: (page - 1) * limit,
        limit,
      },
    });

    const movies = (response.data.data || []).map(toMovieCard);
    if (sort === 'rating') {
      movies.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return movies;
  } catch (error) {
    console.error('Search API call failed:', error);
    return [];
  }
};

export const fetchRecommendData = async (tag: string, page: number = 1) => {
  try {
    const response = await client.get('/api/v1/explore/movies/search', {
      params: {
        tags: tag,
        skip: (page - 1) * 50,
        limit: 50,
      },
    });
    return (response.data.data || []).map(toMovieCard);
  } catch (error) {
    console.error('Recommend API call failed:', error);
    return [];
  }
};

export const fetchMoviesByGenres = async (genreIds: number[], page: number = 1, limit: number = 50) => {
  try {
    const response = await client.get('/api/v1/explore/movies/search', {
      params: {
        genres: genreIds.join(','),
        skip: (page - 1) * limit,
        limit,
      },
    });

    return (response.data.data || []).map(toMovieCard);
  } catch (error) {
    console.error('Genre movie API call failed:', error);
    return [];
  }
};
