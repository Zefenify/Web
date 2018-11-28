import React, { memo } from 'react';
import {
  string,
  bool,
  func,
  number,
  shape,
  oneOf,
} from 'prop-types';
import { Link } from 'react-router-dom';
import styled from 'react-emotion';
import isEqual from 'react-fast-compare';

import { BASE_S3 } from '@app/config/api';
import PlayPause from '@app/component/svg/PlayPause';
import ImageContainer from '@app/component/styled/ImageContainer';


const PlaylistContainer = styled(Link)`
  position: relative;
  width: 25%;
  text-decoration: none;
  color: ${props => props.theme.PRIMARY_4};
  transition: transform 128ms;

  &.active {
    .PlaylistContainer__title {
      color: ${props => props.theme.PRIMARY_4};
    }

    .PlaylistContainer__description {
      color: ${props => props.theme.PRIMARY_4};
    }

    .PlaylistContainer__count {
      color: ${props => props.theme.PRIMARY_5};
    }
  }

  &:not(.active) {
    svg {
      color: hsl(0, 0%, 100%) !important;
    }
  }

  @media(min-width: 1282px) {
    width: 20%;
  }

  .PlaylistContainer__cover {
    position: relative;

    &__overlay {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-color: rgba(51, 51, 51, 0.75);
      border-radius: 6px;

      svg {
        color: inherit;
        width: 64px;
        height: 64px;
      }
    }

    .PlaylistContainer__cover__overlay {
      opacity: 0;
    }

    &:hover .PlaylistContainer__cover__overlay {
      opacity: 1;
    }
  }

  .PlaylistContainer__title {
    font-size: 1.25em;
    font-weight: bold;
    color: ${props => props.theme.NATURAL_2};
  }

  .PlaylistContainer__description {
    color: ${props => props.theme.NATURAL_2};
  }

  .PlaylistContainer__count {
    color: ${props => props.theme.NATURAL_4};
  }

  &:active {
    transform: scale3d(0.95, 0.95, 1);
  }
`;


const Playlist = ({
  type,
  id,
  playing,
  active,
  name,
  description,
  trackCount,
  cover,
  play,
}) => (
  <PlaylistContainer to={`/${type}/${id}`} className={`d-flex flex-column flex-shrink-0 pt-0 px-3 pb-4 ${active === true ? 'active' : ''}`}>
    <div className="PlaylistContainer__cover">
      <ImageContainer>
        <img src={`${BASE_S3}${cover.s3_name}`} alt={name} />
      </ImageContainer>

      <div className="d-flex align-items-center justify-content-center PlaylistContainer__cover__overlay">
        <PlayPause
          strokeWidth="1px"
          playing={playing}
          onClick={(event) => { event.preventDefault(); play(id); }}
        />
      </div>
    </div>

    <strong className="m-0 p-0 mt-2 PlaylistContainer__title">{ name }</strong>
    <p className="m-0 p-0 mt-1 PlaylistContainer__description">{ description }</p>
    <small className="m-0 p-0 mt-2 PlaylistContainer__count">{`${trackCount} SONG${trackCount > 1 ? 'S' : ''}`}</small>
  </PlaylistContainer>
);

Playlist.propTypes = {
  type: oneOf(['featured', 'playlist']),
  id: string,
  playing: bool,
  active: bool,
  name: string,
  description: string,
  trackCount: number,
  cover: shape({}),
  play: func.isRequired,
};

Playlist.defaultProps = {
  type: 'playlist',
  id: '',
  playing: false,
  active: false,
  name: '',
  description: '',
  trackCount: 0,
  cover: {},
};

export default memo(Playlist, (previousProps, nextProps) => isEqual({
  id: previousProps.id,
  playing: previousProps.playing,
  active: previousProps.active,
}, {
  id: nextProps.id,
  playing: nextProps.playing,
  active: nextProps.active,
}));
