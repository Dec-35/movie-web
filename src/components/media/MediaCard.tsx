import classNames from "classnames";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import {
  getMediaDetails,
  getMediaRatings,
  getMediaTrailer,
  mediaItemToId,
} from "@/backend/metadata/tmdb";
import { TMDBContentTypes } from "@/backend/metadata/types/tmdb";
import { DotList } from "@/components/text/DotList";
import { Flare } from "@/components/utils/Flare";
import { MediaItem } from "@/utils/mediaTypes";

import { Button } from "../buttons/Button";
import { IconPatch } from "../buttons/IconPatch";
import { Icon, Icons } from "../Icon";
import { Loading } from "../layout/Loading";
import { BookmarkButton, ItemBookmarkButton } from "../player/Player";

export interface MediaCardProps {
  media: MediaItem;
  linkable?: boolean;
  series?: {
    episode: number;
    season?: number;
    episodeId: string;
    seasonId: string;
  };
  percentage?: number;
  closable?: boolean;
  onClose?: () => void;
}

export interface LinkableMediaCardProps extends MediaCardProps {
  link: string;
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

function MediaCardContent({
  media,
  linkable,
  series,
  percentage,
  closable,
  onClose,
  link,
}: LinkableMediaCardProps) {
  const { t } = useTranslation();
  const percentageString = `${Math.round(percentage ?? 0).toFixed(0)}%`;

  const isReleased = useCallback(() => checkReleased(media), [media]);

  const canLink = linkable && !closable && isReleased();

  const dotListContent = [t(`media.types.${media.type}`)];

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

  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trailerLoaded, setTrailerLoaded] = useState(false);

  const handleClose = (e: React.MouseEvent) => {
    // console.log("handleMouseLeave");
    setLoading(false);
    e.preventDefault();
    setActive(false);
    setTrailerLoaded(false);
  };

  // check if media has all its data. If not, fetch them from the API
  function getDetails() {
    if (
      !media.vote_average ||
      !media.overview ||
      (media.type === "show" && (!media.episodesNb || !media.seasonsNb))
    ) {
      getMediaDetails(
        media.id,
        (media.type === "show" ? "tv" : "movie") as TMDBContentTypes,
      ).then((details) => {
        if (details) {
          media.vote_average = details.vote_average;
          media.overview = details.overview ?? "";
          if (media.type === "show") {
            if (
              "number_of_episodes" in details &&
              "number_of_seasons" in details
            ) {
              media.episodesNb = details.number_of_episodes ?? 0;
              media.seasonsNb = details.number_of_seasons ?? 0;
            }
          }
          setActive(true);
        } else {
          console.error("could not fetch media details");
        }
      });
    } else {
      setActive(true);
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    setLoading(true);
    if (!active) {
      e.preventDefault();
      getMediaTrailer(media.id, media.type).then((trailer) => {
        if (trailer) {
          media.trailer = trailer;
          setTrailerLoaded(true);
        }

        if (media.type === "show")
          getMediaRatings(media.id, media.type).then((ratings) => {
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
    }
  };

  // watch active for scroll
  useEffect(() => {
    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [active]);

  const handleOustideClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose(e);
    }
  };

  return (
    <div className="media-group">
      <Flare.Base
        onClick={handleClick}
        className={`group cursor-pointer -m-3 mb-2 mediaCardElement rounded-xl bg-background-main transition-colors duration-100 focus:relative focus:z-10 ${
          canLink ? "hover:bg-mediaCard-hoverBackground tabbable" : ""
        }${active ? " active" : ""}`}
        tabIndex={canLink ? 0 : -1}
        onKeyUp={(e) => e.key === "Enter" && e.currentTarget.click()}
      >
        <Flare.Light
          flareSize={300}
          cssColorVar="--colors-mediaCard-hoverAccent"
          backgroundClass="bg-mediaCard-hoverBackground duration-100"
          className={classNames({
            "rounded-xl bg-background-main group-hover:opacity-100": canLink,
          })}
        />
        <Flare.Child
          className={`pointer-events-auto relative mb-2 p-3 transition-transform duration-100 ${
            canLink ? "group-hover:scale-95" : "opacity-60"
          }`}
        >
          <div
            className={classNames(
              "relative mb-4 pb-[150%] w-full overflow-hidden rounded-xl bg-mediaCard-hoverBackground bg-cover bg-center transition-[border-radius] duration-100",
              {
                "group-hover:rounded-lg": canLink,
              },
            )}
            style={{
              backgroundImage: media.poster
                ? `url(${media.poster})`
                : undefined,
            }}
          >
            {series ? (
              <div
                className={[
                  "absolute right-2 top-2 rounded-md bg-mediaCard-badge px-2 py-1 transition-colors",
                ].join(" ")}
              >
                <p
                  className={[
                    "text-center text-xs font-bold text-mediaCard-badgeText transition-colors",
                    closable ? "" : "group-hover:text-white",
                  ].join(" ")}
                >
                  {t("media.episodeDisplay", {
                    season: series.season || 1,
                    episode: series.episode,
                  })}
                </p>
              </div>
            ) : null}

            {percentage !== undefined ? (
              <>
                <div
                  className={`absolute inset-x-0 -bottom-px pb-1 h-12 bg-gradient-to-t from-mediaCard-shadow to-transparent transition-colors ${
                    canLink ? "group-hover:from-mediaCard-hoverShadow" : ""
                  }`}
                />
                <div
                  className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-mediaCard-shadow to-transparent transition-colors ${
                    canLink ? "group-hover:from-mediaCard-hoverShadow" : ""
                  }`}
                />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div className="relative h-1 overflow-hidden rounded-full bg-mediaCard-barColor">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-mediaCard-barFillColor"
                      style={{
                        width: percentageString,
                      }}
                    />
                  </div>
                </div>
              </>
            ) : null}

            <div
              className={`absolute inset-0 flex items-center justify-center bg-mediaCard-badge bg-opacity-80 transition-opacity duration-200 ${
                closable ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <IconPatch
                clickable
                className="text-2xl text-mediaCard-badgeText"
                onClick={() => closable && onClose?.()}
                icon={Icons.X}
              />
            </div>
          </div>
          <div>
            <h1 className="mb-1 overflow-hidden max-h-[4.5rem] whitespace-nowrap text-ellipsis break-words font-bold text-white">
              {media.title}
            </h1>
          </div>
          <DotList className="text-xs" content={dotListContent} />
        </Flare.Child>
      </Flare.Base>
      <div
        onClick={handleOustideClick}
        className={`outClickHitbox ${loading ? "active" : ""}`}
      >
        {!active ? (
          <Loading className="centered" />
        ) : (
          <div className={`mediaPreview relative ${active ? "active" : ""}`}>
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
        )}
      </div>
    </div>
  );
}

export function MediaCard(props: MediaCardProps) {
  const isReleased = useCallback(
    () => checkReleased(props.media),
    [props.media],
  );

  const canLink = props.linkable && !props.closable && isReleased();

  let link = canLink
    ? `/media/${encodeURIComponent(mediaItemToId(props.media))}`
    : "#";
  if (canLink && props.series) {
    if (props.series.season === 0 && !props.series.episodeId) {
      link += `/${encodeURIComponent(props.series.seasonId)}`;
    } else {
      link += `/${encodeURIComponent(
        props.series.seasonId,
      )}/${encodeURIComponent(props.series.episodeId)}`;
    }
  }

  const content = <MediaCardContent {...props} link={link} />;

  if (!canLink) return <span>{content}</span>;
  return (
    <div className="relative">
      <div
        className={classNames(
          "tabbable media-card-link ",
          props.closable ? "hover:cursor-default" : "",
        )}
      >
        {content}
      </div>
      <ItemBookmarkButton
        item={props.media}
        className="video-buttonBackground "
      />
    </div>
  );
}
