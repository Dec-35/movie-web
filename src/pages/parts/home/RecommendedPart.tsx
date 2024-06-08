import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getRecommendations } from "@/backend/metadata/tmdb";
import { Icon, Icons } from "@/components/Icon";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { MediaGrid } from "@/components/media/MediaGrid";
import { WatchedMediaCard } from "@/components/media/WatchedMediaCard";
import { useBookmarkStore } from "@/stores/bookmarks";
import { useProgressStore } from "@/stores/progress";
import { MediaItem } from "@/utils/mediaTypes";

export function RecommendedPart() {
  const [gridRef] = useAutoAnimate<HTMLDivElement>();
  const { t } = useTranslation();

  const [items, setItems] = useState<MediaItem[]>([]);
  const progress = useProgressStore((s) => s.items);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const bookmarkItems = useMemo(() => {
    const output: MediaItem[] = [];
    Object.entries(bookmarks).forEach((entry) => {
      output.push({
        id: entry[0],
        ...entry[1],
      });
    });
    return output;
  }, [bookmarks]); // Add an empty array as the second argument
  const progressItems = useMemo(() => {
    const output: MediaItem[] = [];
    Object.entries(progress).forEach((entry) => {
      output.push({
        id: entry[0],
        ...entry[1],
      });
    });
    return output;
  }, [progress]);

  useEffect(() => {
    const allItems = [...progressItems, ...bookmarkItems];
    getRecommendations(allItems).then((elements) => {
      setItems(elements);
    });
  }, [setItems, progressItems, bookmarkItems]);

  const refreshRecommended = () => {
    const button = document.getElementById("refresh");
    button?.classList.remove("refresh-spin");
    setTimeout(() => {
      button?.classList.add("refresh-spin");
    }, 100);
    const allItems = [...progressItems, ...bookmarkItems];
    getRecommendations(allItems).then((elements) => {
      setItems(elements);
    });
  };

  if (items.length === 0) return null;

  return (
    <div>
      <SectionHeading
        title={t("home.recommended.sectionTitle")}
        icon={Icons.FILM}
      >
        {" "}
        <button
          className="ml-2 flex h-12 items-center overflow-hidden rounded-full bg-background-secondary px-4 py-2 text-white transition-[background-color,transform] hover:bg-background-secondaryHover active:scale-105"
          type="button"
          id="refresh"
          onClick={refreshRecommended}
        >
          <Icon icon={Icons.REFRESH} />
        </button>
      </SectionHeading>
      <MediaGrid ref={gridRef}>
        {items.map((v) => (
          <WatchedMediaCard key={v.id} media={v} />
        ))}
      </MediaGrid>
    </div>
  );
}
