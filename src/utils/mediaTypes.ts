export interface MediaItem {
  id: string;
  title: string;
  year?: number;
  release_date?: Date;
  poster?: string;
  type: "show" | "movie";
  trailer?: string;
  overview?: string;
  vote_average?: number;
}
