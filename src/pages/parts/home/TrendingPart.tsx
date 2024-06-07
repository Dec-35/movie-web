import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { getTrendingMediaItems } from "@/backend/metadata/tmdb";
import { PeriodSwitcher } from "@/components/buttons/PeriodSwitcher";
import { Icons } from "@/components/Icon";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { MediaGrid } from "@/components/media/MediaGrid";
import { WatchedMediaCard } from "@/components/media/WatchedMediaCard";
import { MediaItem } from "@/utils/mediaTypes";

export function TrendingPart() {
  const [gridRef] = useAutoAnimate<HTMLDivElement>();
  const { t } = useTranslation();
  const [period, setPeriod] = useState<"day" | "week">("day");
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    getTrendingMediaItems(period).then((elements) => {
      setItems(elements);
    });
  }, [period]);

  return (
    <div>
      <SectionHeading
        title={t("home.trending.sectionTitle")}
        icon={Icons.CLOCK}
      >
        {" "}
        <PeriodSwitcher value={period} change={setPeriod} />
      </SectionHeading>
      <MediaGrid ref={gridRef}>
        {items.map((v) => (
          <WatchedMediaCard key={v.id} media={v} />
        ))}
      </MediaGrid>
    </div>
  );
}
