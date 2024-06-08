import { useCallback } from "react";

import { Icons } from "@/components/Icon";
import { useBookmarkStore } from "@/stores/bookmarks";
import { PlayerMeta } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { MediaItem } from "@/utils/mediaTypes";

import { VideoPlayerButton } from "./Button";

export function BookmarkButton() {
  const addBookmark = useBookmarkStore((s) => s.addBookmark);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const meta = usePlayerStore((s) => s.meta);
  const isBookmarked = !!bookmarks[meta?.tmdbId ?? ""];

  const toggleBookmark = useCallback(() => {
    if (!meta) {
      return;
    }
    if (isBookmarked) removeBookmark(meta.tmdbId);
    else addBookmark(meta);
  }, [meta, isBookmarked, removeBookmark, addBookmark]);

  return (
    <VideoPlayerButton
      onClick={() => toggleBookmark()}
      icon={isBookmarked ? Icons.BOOKMARK : Icons.BOOKMARK_OUTLINE}
      iconSizeClass="text-base"
      className="p-3"
    />
  );
}

export function ItemBookmarkButton(props: {
  item: MediaItem;
  className?: string;
}) {
  const addMediaBookmark = useBookmarkStore((s) => s.addMediaBookmark);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const isBookmarked = !!bookmarks[props.item.id];

  const toggleBookmark = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation(); // Stop the click event from propagating to the parent
      if (isBookmarked) {
        removeBookmark(props.item.id);
      } else {
        addMediaBookmark(props.item);
      }
    },
    [isBookmarked, removeBookmark, props.item, addMediaBookmark],
  );

  return (
    <VideoPlayerButton
      onClick={toggleBookmark}
      icon={isBookmarked ? Icons.BOOKMARK : Icons.BOOKMARK_OUTLINE}
      iconSizeClass="text-base"
      className={`p-3 video-buttonBackground ${props.className}`}
    />
  );
}
