import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getRecommendations } from "@/backend/metadata/tmdb";
import { Icons } from "@/components/Icon";
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

  return (
    <div>
      <SectionHeading
        title={t("home.recommended.sectionTitle")}
        icon={Icons.FILM}
      >
        {" "}
      </SectionHeading>
      <MediaGrid ref={gridRef}>
        {items.map((v) => (
          <WatchedMediaCard key={v.id} media={v} />
        ))}
      </MediaGrid>
    </div>
  );
}
