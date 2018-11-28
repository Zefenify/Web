import React, { memo } from 'react';
import {
  bool,
  number,
  string,
  arrayOf,
  shape,
  func,
} from 'prop-types';
import { Link } from 'react-router-dom';
import styled from 'react-emotion';
import isEqual from 'react-fast-compare';

import { BASE_S3 } from '@app/config/api';
import ArtistList from '@app/component/presentational/ArtistList';
import Button from '@app/component/styled/Button';
import Share from '@app/component/svg/Share';
import Track from '@app/component/presentational/Track';
import ImageContainer from '@app/component/styled/ImageContainer';


const AlbumContainer = styled.div`
  .AlbumContainer {
    &__album-play-more {
      flex: 0 0 250px;

      img {
        height: 250px;
        width: 250px;
      }
    }

    &__album-title a {
      color: ${props => props.theme.NATURAL_2};
      text-decoration: none;
    }

    &__album-artist a {
      color: ${props => props.theme.NATURAL_3};
      text-decoration: none;
      font-size: 1.125rem;
    }

    &__album-year-track-count {
      color: ${props => props.theme.NATURAL_4};
    }
  }
`;


const Album = ({
  showArtist,
  albumId,
  title,
  cover,
  year,
  artist,
  tracks,
  current,
  playing,
  albumPlaying,
  duration,
  albumPlayPause,
  trackPlayPause,
  contextMenuAlbum,
  contextMenuTrack,
}) => {
  const { hour, minute, second } = duration;

  return (
    <AlbumContainer className="d-flex flex-row flex-shrink-0">
      <div className="AlbumContainer__album-play-more mb-5">
        <ImageContainer borderRadius="6px">
          <img src={`${BASE_S3}${cover.s3_name}`} alt={`Album cover for ${title}`} />
        </ImageContainer>

        <div className="d-flex flex-row justify-content-center mt-4">
          <Button className="mr-3" style={{ width: '125px' }} onClick={albumPlayPause}>{`${albumPlaying && playing ? 'PAUSE' : 'PLAY'}`}</Button>

          <Button
            className="p-0"
            style={{ backgroundColor: 'transparent', width: '38px' }}
            themeColor
            themeBorder
            noShadow
            onClick={contextMenuAlbum}
          >
            <Share />
          </Button>
        </div>
      </div>

      <div className="d-flex flex-column flex-grow-1" style={{ paddingLeft: '2rem' }}>
        <h1 className="m-0 AlbumContainer__album-title"><Link to={`/album/${albumId}`}>{ title }</Link></h1>

        {
          showArtist === false ? null : (
            <div className="mt-2 AlbumContainer__album-artist">
              <span>By&nbsp;</span>
              <ArtistList artist={artist} />
            </div>
          )
        }

        <div className="AlbumContainer__album-year-track-count my-2">
          <span>{`${year} • ${tracks.length} Song${tracks.length > 1 ? 's' : ''} • ${hour > 0 ? `${hour} hr` : ''} ${minute} min ${hour > 0 ? '' : `${second} sec`}`}</span>
        </div>

        {
          tracks.map((track, index) => (
            <Track
              fullDetail={false}
              key={track.track_id}
              currentTrackId={current === null ? '' : current.track_id}
              trackNumber={index + 1}
              trackPlayPause={trackPlayPause}
              playing={playing}
              trackId={track.track_id}
              trackName={track.track_name}
              trackFeaturing={track.track_featuring}
              trackDuration={track.track_track.s3_meta.duration}
              trackAlbum={track.track_album}
              contextMenuTrack={contextMenuTrack}
            />
          ))
        }
      </div>
    </AlbumContainer>
  );
};

Album.propTypes = {
  showArtist: bool,
  albumId: string,
  cover: shape({}),
  title: string,
  year: number,
  artist: arrayOf(shape({})),
  current: shape({}),
  tracks: arrayOf(shape({})),
  duration: shape({
    hour: number,
    minute: number,
    second: number,
  }),
  playing: bool,
  albumPlaying: bool,
  albumPlayPause: func.isRequired,
  trackPlayPause: func.isRequired,
  contextMenuAlbum: func.isRequired,
  contextMenuTrack: func.isRequired,
};

Album.defaultProps = {
  showArtist: false,
  albumId: '',
  cover: {},
  title: '',
  year: 1991,
  artist: [],
  current: null,
  tracks: [],
  duration: {
    hour: 0,
    minute: 0,
    second: 0,
  },
  playing: false,
  albumPlaying: false,
};

export default memo(Album, (previousProps, nextProps) => isEqual({
  albumId: previousProps.albumId,
  current: previousProps.current,
  playing: previousProps.playing,
  albumPlaying: previousProps.albumPlaying,
}, {
  albumId: nextProps.albumId,
  current: nextProps.current,
  playing: nextProps.playing,
  albumPlaying: nextProps.albumPlaying,
}));
