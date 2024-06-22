import { ProgressItem } from "@/stores/progress";

export interface Season {
  title: string;
  number: number;
  id: string;
}

export interface Episode {
  title: string;
  number: number;
  id: string;
  seasonId: string;
  updatedAt: number;
  progress: ProgressItem;
}

export interface MediaItem {
  rating?: number;
  adult?: boolean;
  id: string;
  title: string;
  year?: number;
  release_date?: Date;
  poster?: string;
  type: "show" | "movie";
  trailer?: string;
  overview?: string;
  vote_average?: number;
  seasonsNb?: number;
  episodesNb?: number;
}
