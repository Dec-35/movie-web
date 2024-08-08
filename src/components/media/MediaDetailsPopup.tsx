import { t } from "i18next";
import { MouseEvent, Suspense, useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getMediaDetails,
  getMediaRatings,
  getMediaTrailer,
  mediaItemToId,
} from "@/backend/metadata/tmdb";
import { TMDBContentTypes } from "@/backend/metadata/types/tmdb";
import { MediaItem } from "@/utils/mediaTypes";

import { Button } from "../buttons/Button";
import { Icon, Icons } from "../Icon";
import { Loading } from "../layout/Loading";
import { VideoPlayerButton } from "../player/internals/Button";
import { ItemBookmarkButton } from "../player/Player";
import { DotList } from "../text/DotList";

function handleShare(target: EventTarget & HTMLButtonElement, props: any) {
  const url = `${window.location.hostname}:${window.location.port}/#/media/details/${props.type}-${props.mediaId}`;
  navigator.clipboard.writeText(url);

  // show copied to clipboard under the share button
  const button = target;
  const toast = document.createElement("div");
  toast.classList.add("toast");
  toast.textContent = t("actions.copied");
  button.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2000);
}

function checkReleased(media: MediaItem): boolean {
  const isReleasedYear = Boolean(
    media.year && media.year <= new Date().getFullYear(),
  );
  const isReleasedDate = Boolean(
    media.release_date && media.release_date <= new Date(),
  );

  // If the media has a release date, use that, otherwise use the year
  const isReleased = media.release_date ? isReleasedDate : isReleasedYear;

  return isReleased;
}

export function MediaDetailsPopup(props: {
  show: boolean;
  url: boolean;
  close?: (value: boolean) => void;
  type: TMDBContentTypes;
  mediaId: string;
}) {
  const navigate = useNavigate();
  const mediaType = props.type === "tv" ? "show" : "movie";

  const media: MediaItem = useMemo(
    () => ({
      rating: 0,
      adult: true,
      id: props.mediaId,
      title: "",
      year: 0,
      release_date: new Date(),
      poster: "",
      type: mediaType,
      trailer: "",
      overview: "",
      vote_average: 0,
      seasonsNb: 0,
      episodesNb: 0,
    }),
    [props.mediaId, mediaType],
  );

  const dotListContent = [t(`media.types.${media.type}`)];
  const isReleased = useCallback(() => checkReleased(media), [media]);
  const [trailerLoaded, setTrailerLoaded] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  if (!props.show) {
    return null;
  }

  function handleClose() {
    document.body.style.overflow = "";
    if (props.url) navigate("/", { replace: true });
    else if (props.close) props.close(false);
  }

  document.body.style.overflow = "hidden";

  if (media.year) {
    dotListContent.push(media.year.toFixed());
  }

  if (!isReleased()) {
    dotListContent.push(t("media.unreleased"));
  }

  if (media.rating) {
    dotListContent.push(`${media.rating}+`);
  }

  const showDotListContent = [
    `${media.seasonsNb} ${t("player.menus.seasons.button")}`,
  ];
  showDotListContent.push(
    `${media.episodesNb} ${t("player.menus.episodes.button")}`,
  );

  const link = `/media/${encodeURIComponent(mediaItemToId(media))}`;

  function getDetails() {
    if (
      !media.vote_average ||
      !media.overview ||
      (mediaType === "show" && (!media.episodesNb || !media.seasonsNb))
    ) {
      getMediaDetails(props.mediaId, props.type).then((details) => {
        if (details) {
          media.vote_average = details.vote_average;
          media.overview = details.overview ?? "";
          if (mediaType === "show") {
            if (
              "number_of_episodes" in details &&
              "number_of_seasons" in details
            ) {
              media.episodesNb = details.number_of_episodes ?? 0;
              media.seasonsNb = details.number_of_seasons ?? 0;
            }
          }
        } else {
          console.error("could not fetch media details");
        }
        setMediaLoaded(true);
      });
    } else {
      setMediaLoaded(true);
    }
  }

  getMediaTrailer(props.mediaId, mediaType).then((trailer) => {
    if (trailer) {
      media.trailer = trailer;
      setTrailerLoaded(true);
    }

    if (mediaType === "show")
      getMediaRatings(props.mediaId, "show").then((ratings) => {
        // get UK rating
        if (ratings) {
          media.rating = ratings.find(
            (rating: { iso_3166_1: string }) => rating.iso_3166_1 === "GB",
          )?.rating;
        }
        getDetails();
      });
    else {
      // 18+ === media.adult?
      if (media.adult) {
        media.rating = 18;
      }
      getDetails();
    }
  });

  return (
    <div
      className="outClickHitbox active"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {mediaLoaded && trailerLoaded ? (
        <div className="mediaPreview relative">
          <div className="fixed top-5 right-5 z-10">
            <button onClick={handleClose} type="button">
              <Icon icon={Icons.X} />
            </button>
          </div>
          <div className="mediaTrailerContainer">
            {trailerLoaded ? (
              <iframe
                className="mediaTrailer"
                src={`https://www.youtube.com/embed/${media.trailer}?modestbranding=1&autohide=1&showinfo=0&controls=0&autoplay=1&cc_load_policy=1&iv_load_policy=3&rel=0&loop=0`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex justify-center items-center w-full h-full bg-slate-950">
                No trailer found. Check on YouTube.
              </div>
            )}
          </div>
          <div className="mediaPreviewContent flex flex-col gap-2">
            <span className="flex flex-wrap gap-3 items-end">
              {" "}
              <h1 className="text-white text-2xl font-bold w-100 text-wrap">
                {media.title}
              </h1>
              <DotList
                className="text-xs pb-1 mr-auto"
                content={dotListContent}
              />
              {media.type === "show" ? (
                <DotList
                  className="text-xs pb-1"
                  content={showDotListContent}
                />
              ) : null}
              <VideoPlayerButton
                onClick={(e) => handleShare(e.currentTarget, props)}
                icon={Icons.SHARE}
                className="top-1 relative"
              />
              <ItemBookmarkButton
                item={media}
                className="ml-auto md:ml-0 top-2 relative"
              />
            </span>
            <div className="divider" />
            <span className="flex gap-3 media-desc-container items-center justify-between">
              <p className="media-desc text-secondary text-sm">
                {media.overview}
              </p>
              <span>
                <h3 className="vote_avergae-label">
                  {media.vote_average?.toFixed(1)}/10
                </h3>
                <Link to={link} tabIndex={-1}>
                  <Button
                    className="px-3 py-2 mt-2"
                    iconLeft
                    icon={Icons.ARROW_RIGHT}
                  >
                    {t("home.watch")}
                  </Button>
                </Link>
              </span>
            </span>
          </div>
        </div>
      ) : (
        <div className="h-full w-full flex justify-center items-center">
          <Loading />
        </div>
      )}
    </div>
  );
}
