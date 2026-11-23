import { useEffect, useRef, useState } from 'react';
import type { VideoContent } from '../../component-types/content';
import { Icon } from '../Icon';
import { Image } from '../Image';
import styles from './VideoEmbed.module.css';

/**
 * Props for VideoEmbed: the VideoContent fields (provider, `videoId` for YouTube/Vimeo or `src` for
 * `generic`, title, poster) plus the aspect ratio.
 */
export interface VideoEmbedProps extends VideoContent {
  /** CSS aspect-ratio. Default "16 / 9". */
  aspectRatio?: string;
}

const providerName: Record<VideoContent['provider'], string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  generic: 'an external website',
};

/** Embed URL on privacy-enhanced hosts. Pure, so it can be tested without loading anything. */
export function videoEmbedUrl({ provider, videoId, src }: Pick<VideoContent, 'provider' | 'videoId' | 'src'>): string {
  if (provider === 'youtube') return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId ?? '')}?autoplay=1`;
  if (provider === 'vimeo') return `https://player.vimeo.com/video/${encodeURIComponent(videoId ?? '')}?dnt=1&autoplay=1`;
  return src ?? '';
}

/**
 * Click-to-load video. Until the user presses play, only a local poster is shown: no iframe, no
 * request to the provider. Activation creates the iframe (autoplaying, since the user asked to play)
 * and moves focus into it.
 */
export function VideoEmbed({ provider, videoId, src, title, poster, aspectRatio = '16 / 9' }: VideoEmbedProps) {
  const [active, setActive] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (active) iframeRef.current?.focus();
  }, [active]);

  return (
    <div className={styles.root}>
      <div className={styles.frame} style={{ aspectRatio }}>
        {active ? (
          <iframe
            ref={iframeRef}
            src={videoEmbedUrl({ provider, videoId, src })}
            title={title}
            loading="lazy"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className={styles.iframe}
          />
        ) : (
          <>
            {poster ? (
              <Image {...poster} alt="" fit="cover" className={styles.poster} />
            ) : (
              <div className={styles.placeholder} aria-hidden="true" />
            )}
            <button type="button" className={styles.play} onClick={() => setActive(true)} aria-label={`Play video: ${title}`}>
              <Icon name="play" size="lg" />
            </button>
          </>
        )}
      </div>
      {!active && (
        <p className={styles.note}>
          <Icon name="external-link" size="sm" />
          Opens content from {providerName[provider]}.
        </p>
      )}
    </div>
  );
}

/** A text track (WebVTT file) for Video, rendered as a `<track>` element. */
export interface VideoTrack {
  /** URL of the WebVTT file. Must be unique among the tracks (used as the key). */
  src: string;
  /** Language of the track, e.g. "en". */
  srcLang: string;
  /** Name shown in the player's track menu, e.g. "English". */
  label: string;
  /** Track kind. Default "captions". */
  kind?: 'captions' | 'subtitles' | 'descriptions';
  /** Enable this track by default. */
  default?: boolean;
}

/** Props for Video. */
export interface VideoProps {
  /** Self-hosted file URL. */
  src: string;
  /** Accessible name. */
  title: string;
  /** Local poster image URL. */
  poster?: string;
  /** Captions, subtitles or descriptions. */
  tracks?: VideoTrack[];
  /** CSS aspect-ratio. Default "16 / 9". */
  aspectRatio?: string;
}

/** Self-hosted video with native controls. preload="none": nothing downloads until play. */
export function Video({ src, title, poster, tracks = [], aspectRatio = '16 / 9' }: VideoProps) {
  return (
    <div className={styles.root}>
      <video controls preload="none" poster={poster} aria-label={title} className={styles.video} style={{ aspectRatio }}>
        <source src={src} />
        {tracks.map((track) => (
          <track
            key={track.src}
            src={track.src}
            srcLang={track.srcLang}
            label={track.label}
            kind={track.kind ?? 'captions'}
            default={track.default}
          />
        ))}
      </video>
    </div>
  );
}
