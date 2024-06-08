import slugify from "slugify";

import { conf } from "@/setup/config";
import { MediaItem } from "@/utils/mediaTypes";

import { MWMediaMeta, MWMediaType, MWSeasonMeta } from "./types/mw";
import {
  ExternalIdMovieSearchResult,
  TMDBContentTypes,
  TMDBEpisodeShort,
  TMDBMediaResult,
  TMDBMovieData,
  TMDBMovieSearchResult,
  TMDBSearchResult,
  TMDBSeason,
  TMDBSeasonMetaResult,
  TMDBShowData,
  TMDBShowSearchResult,
} from "./types/tmdb";
import { mwFetch } from "../helpers/fetch";

export function mediaTypeToTMDB(type: MWMediaType): TMDBContentTypes {
  if (type === MWMediaType.MOVIE) return TMDBContentTypes.MOVIE;
  if (type === MWMediaType.SERIES) return TMDBContentTypes.TV;
  throw new Error("unsupported type");
}

export function mediaItemTypeToMediaType(type: MediaItem["type"]): MWMediaType {
  if (type === "movie") return MWMediaType.MOVIE;
  if (type === "show") return MWMediaType.SERIES;
  throw new Error("unsupported type");
}

export function TMDBMediaToMediaType(type: TMDBContentTypes): MWMediaType {
  if (type === TMDBContentTypes.MOVIE) return MWMediaType.MOVIE;
  if (type === TMDBContentTypes.TV) return MWMediaType.SERIES;
  throw new Error("unsupported type");
}

export function TMDBMediaToMediaItemType(
  type: TMDBContentTypes,
): MediaItem["type"] {
  if (type === TMDBContentTypes.MOVIE) return "movie";
  if (type === TMDBContentTypes.TV) return "show";
  throw new Error("unsupported type");
}

export function formatTMDBMeta(
  media: TMDBMediaResult,
  season?: TMDBSeasonMetaResult,
): MWMediaMeta {
  const type = TMDBMediaToMediaType(media.object_type);
  let seasons: undefined | MWSeasonMeta[];
  if (type === MWMediaType.SERIES) {
    seasons = media.seasons
      ?.sort((a, b) => a.season_number - b.season_number)
      .map(
        (v): MWSeasonMeta => ({
          title: v.title,
          id: v.id.toString(),
          number: v.season_number,
        }),
      );
  }

  return {
    title: media.title,
    id: media.id.toString(),
    year: media.original_release_date?.getFullYear()?.toString(),
    poster: media.poster,
    type,
    seasons: seasons as any,
    seasonData: season
      ? {
          id: season.id.toString(),
          number: season.season_number,
          title: season.title,
          episodes: season.episodes
            .sort((a, b) => a.episode_number - b.episode_number)
            .map((v) => ({
              id: v.id.toString(),
              number: v.episode_number,
              title: v.title,
              air_date: v.air_date,
            })),
        }
      : (undefined as any),
  };
}

export function formatTMDBMetaToMediaItem(media: TMDBMediaResult): MediaItem {
  const type = TMDBMediaToMediaItemType(media.object_type);

  return {
    title: media.title,
    id: media.id.toString(),
    year: media.original_release_date?.getFullYear() ?? 0,
    release_date: media.original_release_date,
    poster: media.poster,
    type,
    overview: media.overview,
    vote_average: media.vote_average,
  };
}

export function TMDBIdToUrlId(
  type: MWMediaType,
  tmdbId: string,
  title: string,
) {
  return [
    "tmdb",
    mediaTypeToTMDB(type),
    tmdbId,
    slugify(title, { lower: true, strict: true }),
  ].join("-");
}

export function TMDBMediaToId(media: MWMediaMeta): string {
  return TMDBIdToUrlId(media.type, media.id, media.title);
}

export function mediaItemToId(media: MediaItem): string {
  return TMDBIdToUrlId(
    mediaItemTypeToMediaType(media.type),
    media.id,
    media.title,
  );
}

export function decodeTMDBId(
  paramId: string,
): { id: string; type: MWMediaType } | null {
  const [prefix, type, id] = paramId.split("-", 3);
  if (prefix !== "tmdb") return null;
  let mediaType;
  try {
    mediaType = TMDBMediaToMediaType(type as TMDBContentTypes);
  } catch {
    return null;
  }
  return {
    type: mediaType,
    id,
  };
}

const tmdbBaseUrl1 = "https://api.themoviedb.org/3";
const tmdbBaseUrl2 = "https://api.tmdb.org/3";

const apiKey = conf().TMDB_READ_API_KEY;

const tmdbHeaders = {
  accept: "application/json",
  Authorization: `Bearer ${apiKey}`,
};

function abortOnTimeout(timeout: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller.signal;
}

async function get<T>(url: string, params?: object): Promise<T> {
  if (!apiKey) throw new Error("TMDB API key not set");
  try {
    return await mwFetch<T>(encodeURI(url), {
      headers: tmdbHeaders,
      baseURL: tmdbBaseUrl1,
      params: {
        ...params,
      },
      signal: abortOnTimeout(5000),
    });
  } catch (err) {
    return mwFetch<T>(encodeURI(url), {
      headers: tmdbHeaders,
      baseURL: tmdbBaseUrl2,
      params: {
        ...params,
      },
      signal: abortOnTimeout(30000),
    });
  }
}

export async function multiSearch(
  query: string,
): Promise<(TMDBMovieSearchResult | TMDBShowSearchResult)[]> {
  const data = await get<TMDBSearchResult>("search/multi", {
    query,
    include_adult: false,
    language: "en-US",
    page: 1,
  });
  // filter out results that aren't movies or shows
  const results = data.results.filter(
    (r) =>
      r.media_type === TMDBContentTypes.MOVIE ||
      r.media_type === TMDBContentTypes.TV,
  );
  return results;
}

export async function getTrending(
  period: string,
): Promise<(TMDBMovieSearchResult | TMDBShowSearchResult)[]> {
  const data = await get<TMDBSearchResult>(`trending/all/${period}`, {
    language: "en-US",
    page: 1,
  });
  // filter out results that aren't movies or shows
  const results = data.results.filter(
    (r) =>
      r.media_type === TMDBContentTypes.MOVIE ||
      r.media_type === TMDBContentTypes.TV,
  );
  return results;
}

export async function getRelated(
  id: string,
  type: MWMediaType,
): Promise<(TMDBMovieSearchResult | TMDBShowSearchResult)[]> {
  const data = await get<TMDBSearchResult>(
    `${mediaTypeToTMDB(type)}/${id}/recommendations`,
    {
      language: "en-US",
      page: 1,
    },
  );
  // filter out results that aren't movies or shows
  const results = data.results.filter(
    (r) =>
      r.media_type === TMDBContentTypes.MOVIE ||
      r.media_type === TMDBContentTypes.TV,
  );
  return results;
}

export async function generateQuickSearchMediaUrl(
  query: string,
): Promise<string | undefined> {
  const data = await multiSearch(query);
  if (data.length === 0) return undefined;
  const result = data[0];
  const title =
    result.media_type === TMDBContentTypes.MOVIE ? result.title : result.name;

  return `/media/${TMDBIdToUrlId(
    TMDBMediaToMediaType(result.media_type),
    result.id.toString(),
    title,
  )}`;
}

// Conditional type which for inferring the return type based on the content type
type MediaDetailReturn<T extends TMDBContentTypes> =
  T extends TMDBContentTypes.MOVIE
    ? TMDBMovieData
    : T extends TMDBContentTypes.TV
      ? TMDBShowData
      : never;

export function getMediaDetails<
  T extends TMDBContentTypes,
  TReturn = MediaDetailReturn<T>,
>(id: string, type: T): Promise<TReturn> {
  if (type === TMDBContentTypes.MOVIE) {
    return get<TReturn>(`/movie/${id}`, { append_to_response: "external_ids" });
  }
  if (type === TMDBContentTypes.TV) {
    return get<TReturn>(`/tv/${id}`, { append_to_response: "external_ids" });
  }
  throw new Error("Invalid media type");
}

export function getMediaPoster(posterPath: string | null): string | undefined {
  if (posterPath) return `https://image.tmdb.org/t/p/w342/${posterPath}`;
}

export async function getEpisodes(
  id: string,
  season: number,
): Promise<TMDBEpisodeShort[]> {
  const data = await get<TMDBSeason>(`/tv/${id}/season/${season}`);
  return data.episodes.map((e) => ({
    id: e.id,
    episode_number: e.episode_number,
    title: e.name,
    air_date: e.air_date,
  }));
}

export async function getMovieFromExternalId(
  imdbId: string,
): Promise<string | undefined> {
  const data = await get<ExternalIdMovieSearchResult>(`/find/${imdbId}`, {
    external_source: "imdb_id",
  });

  const movie = data.movie_results[0];
  if (!movie) return undefined;

  return movie.id.toString();
}

export function formatTMDBSearchResult(
  result: TMDBMovieSearchResult | TMDBShowSearchResult,
  mediatype: TMDBContentTypes,
): TMDBMediaResult {
  const type = TMDBMediaToMediaType(mediatype);
  if (type === MWMediaType.SERIES) {
    const show = result as TMDBShowSearchResult;
    return {
      title: show.name,
      poster: getMediaPoster(show.poster_path),
      id: show.id,
      original_release_date: new Date(show.first_air_date),
      object_type: mediatype,
      overview: show.overview,
      vote_average: show.vote_average,
    };
  }

  const movie = result as TMDBMovieSearchResult;
  return {
    title: movie.title,
    poster: getMediaPoster(movie.poster_path),
    id: movie.id,
    original_release_date: new Date(movie.release_date),
    object_type: mediatype,
    overview: movie.overview,
    vote_average: movie.vote_average,
  };
}

export async function getTrendingMediaItems(
  period: string,
): Promise<MediaItem[]> {
  const data = await getTrending(period);
  return data.map((result) =>
    formatTMDBMetaToMediaItem(
      formatTMDBSearchResult(result, result.media_type),
    ),
  );
}

export async function getRecommendations(
  userMedia: MediaItem[],
): Promise<MediaItem[]> {
  // Shuffle the userMedia array to introduce randomness
  const shuffledUserMedia = userMedia.sort(() => Math.random() - 0.5);

  // Select a maximum of 10 unique items from the shuffled list
  const uniqueItems = shuffledUserMedia.slice(0, 10);

  // Fetch similar items for each selected unique item
  const promises = uniqueItems.map((media) =>
    getRelated(media.id, mediaItemTypeToMediaType(media.type)),
  );

  const results = await Promise.all(promises);

  // Flatten the results into a single array
  const allItems = results
    .flat()
    .map((result) =>
      formatTMDBMetaToMediaItem(
        formatTMDBSearchResult(result, result.media_type),
      ),
    );

  // Count occurrences of each item
  const itemCounts: { [key: string]: { item: MediaItem; count: number } } = {};

  allItems.forEach((item) => {
    const key = item.id; // Assuming MediaItem has an 'id' property
    if (itemCounts[key]) {
      itemCounts[key].count += 2;
    } else {
      itemCounts[key] = { item, count: 1 };
    }
  });

  // Create a set of input item IDs for easy lookup
  const inputItemIds = new Set(userMedia.map((item) => item.id));

  // Create the final list with unique items and their scores, excluding input items
  const finalList = Object.values(itemCounts)
    .map(({ item, count }) => ({
      ...item,
      score: count,
    }))
    .filter((item) => !inputItemIds.has(item.id));

  const randomItems = finalList.filter(() => Math.random() > 0.8);
  randomItems.forEach((item) => {
    item.score += 1;
  });

  // Sort by score in descending order and take the top items
  const sortedFinalList = finalList
    .sort((a, b) => b.score - a.score)
    .slice(0, 40);

  return sortedFinalList;
}

export async function getMediaTrailer(
  id: string,
  type: "movie" | "show",
): Promise<string | undefined> {
  const data = await get<any | TMDBShowData>(
    `${type === "show" ? "tv" : "movie"}/${id}/videos`,
  );
  const trailer = data.results.find(
    (v: { type: string }) => v.type === "Trailer",
  );
  return trailer?.key;
}
