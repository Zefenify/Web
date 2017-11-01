import React, { Component } from 'react';
import { string, bool, func, shape } from 'prop-types';

import { PLAY_REQUEST, PLAY_PAUSE_REQUEST } from '@app/redux/constant/wolfCola';
import sameSongList from '@app/util/sameSongList';
import { human } from '@app/util/time';

import api from '@app/util/api';
import store from '@app/redux/store';

import DJKhaled from '@app/component/hoc/DJKhaled';

import Top from '@app/component/presentational/Top';

class TopContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      most: null,
      duration: {
        hours: 0,
        minutes: 0,
        seconds: 0,
      },
      playingTheSameMost: false,
    };

    this.togglePlayPauseAll = this.togglePlayPauseAll.bind(this);
    this.togglePlayPauseSong = this.togglePlayPauseSong.bind(this);
  }

  componentDidMount() {
    if (this.props.match.params.category === undefined) {
      this.props.history.replace('/top/recent');
      return;
    }

    this.loadSongs(this.props.match.params.category);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.match.params.category === undefined) {
      this.props.history.replace('/top/recent');
      return;
    }

    if (nextProps.match.params.category !== this.props.match.params.category) {
      this.loadSongs(nextProps.match.params.category);
    }
  }

  componentWillUnmount() {
    this.cancelRequest();
  }

  loadSongs(filter) {
    if (['recent', 'liked', 'played'].includes(filter) === false) {
      this.props.history.replace('/top/recent');
      return;
    }

    // this makes sure tab navigation clears previous render
    this.setState(() => ({
      most: null,
    }));

    if (this.cancelRequest !== undefined) {
      this.cancelRequest();
    }

    api(`json/list/most${filter}.json`, (cancel) => {
      this.cancelRequest = cancel;
    })
      .then((data) => {
        this.setState(() => ({
          most: data,
          duration: human(data.songs.reduce((totalD, song) => totalD + song.playtime, 0), true),
        }), () => {
          const { queueInitial } = store.getState();

          if (queueInitial.length === 0 || this.state.most.songs.length === 0) {
            this.setState(() => ({
              playingTheSameMost: false,
            }));

            return;
          }

          if (sameSongList(this.state.most.songs, queueInitial)) {
            this.setState(() => ({
              playingTheSameMost: true,
            }));
          } else {
            this.setState(() => ({
              playingTheSameMost: false,
            }));
          }
        });
      }, () => {
        /* handle error */
      });
  }

  togglePlayPauseAll() {
    if (this.state.most === null) {
      return;
    }

    // booting playlist
    if (this.props.current === null || this.state.playingTheSameMost === false) {
      store.dispatch({
        type: PLAY_REQUEST,
        payload: {
          play: this.state.most.songs[0],
          queue: this.state.most.songs,
          queueInitial: this.state.most.songs,
        },
      });

      this.setState(() => ({
        playingTheSameMost: true,
      }));
      // resuming / pausing playlist
    } else if (this.props.current !== null) {
      store.dispatch({
        type: PLAY_PAUSE_REQUEST,
      });
    }
  }

  togglePlayPauseSong(songId) {
    if (this.props.current !== null && this.props.current.songId === songId) {
      store.dispatch({
        type: PLAY_PAUSE_REQUEST,
      });

      return;
    }

    const songIdIndex = this.state.most.songs.findIndex(song => song.songId === songId);

    if (songIdIndex === -1) {
      return;
    }

    store.dispatch({
      type: PLAY_REQUEST,
      payload: {
        play: this.state.most.songs[songIdIndex],
        queue: this.state.most.songs,
        queueInitial: this.state.most.songs,
      },
    });

    this.setState(() => ({
      playingTheSameMost: true,
    }));
  }

  render() {
    return (
      <Top
        most={this.state.most}
        current={this.props.current}
        playing={this.props.playing}
        duration={this.state.duration}
        playingTheSameMost={this.state.playingTheSameMost}
        togglePlayPauseAll={this.togglePlayPauseAll}
        togglePlayPauseSong={this.togglePlayPauseSong}
      />
    );
  }
}

TopContainer.propTypes = {
  playing: bool,
  current: shape({}),
  history: shape({
    replace: func,
  }).isRequired,
  match: shape({
    params: shape({
      id: string,
    }),
  }).isRequired,
};

TopContainer.defaultProps = {
  playing: false,
  current: null,
};

module.exports = DJKhaled('current', 'playing')(TopContainer);
