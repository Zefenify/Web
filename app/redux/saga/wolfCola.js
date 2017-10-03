/**
 * Everything to do with Howler is handled here. it doesn't necessary have
 * *direct* association with Redux store, but knows what sags to call
 */

import { eventChannel, END, delay } from 'redux-saga';
import { select, put, call, fork, take, throttle, takeEvery, takeLatest } from 'redux-saga/effects';
import { Howl } from 'howler';
import random from 'lodash/fp/random';
import notie from 'notie';

import { PLAY, NEXT, PREVIOUS, SEEK, TOGGLE_PLAY_PAUSE, PREVIOUS_THRESHOLD } from '@app/redux/constant/wolfCola';
import { BASE_S3 } from '@app/config/api';

import { current } from '@app/redux/action/current';
import { queueSet, queueRemove } from '@app/redux/action/queue';
import { duration } from '@app/redux/action/duration';
import { playbackPosition } from '@app/redux/action/playbackPosition';
import { playing } from '@app/redux/action/playing';
import { initialQueue } from '@app/redux/action/initialQueue';
import { historyPush, historyPop, historyFront } from '@app/redux/action/history';
import { loading } from '@app/redux/action/loading';

const wolfCola = {
  playingKey: 'current',
  current: null,
  next: null,
  crossfadeInProgress: false,
};

// Howler `load` event will be yielded - so if it's never loaded
const promiseifyHowlEvent = (howl, eventName) => new Promise((resolve) => {
  if (howl !== null) {
    howl.once(eventName, (e) => {
      resolve(e);
    });
  }
});

// Emitter - we have PUT in the `end` callback
// 1. clearing if there's no _next_
// 2. passing playing key to the song that's fading in
const howlerEndChannel = key => eventChannel((emitter) => {
  wolfCola[key].once('end', (end) => {
    emitter({ end });
    emitter(END);
  });

  return () => {};
});

const howlerLoadErrorChannel = key => eventChannel((emitter) => {
  wolfCola[key].once('loaderror', (loadError) => {
    notie.alert({
      type: 'error',
      text: 'ወይኔ - unable to load music',
      time: 5,
    });

    /* handle song load error */
    wolfCola.crossfadeInProgress = false;
    emitter({ loadError });
    emitter(END);
  });

  return () => {};
});

// checks if there's only one item in the history and the current play matches
// this behavior is taken from Apple Music
const playingLastHistory = s => s.history.length === 1 && s.current.track_id === s.history[0].track_id;

// Channel - listens to `end` and clears `end`ed song
function* howlerEnd(key) {
  const channel = yield call(howlerEndChannel, key);

  // we're only taking a single event i.e. { end }
  yield take(channel);
  wolfCola[wolfCola.playingKey].off();
  wolfCola[wolfCola.playingKey].unload();
  wolfCola[wolfCola.playingKey] = null;
  wolfCola.crossfadeInProgress = false;
  yield put({ type: NEXT });
}

function* howlerLoadError(key) {
  const channel = yield call(howlerLoadErrorChannel, key);

  yield take(channel);
  yield put(loading(false));
}

/**
 * returns a generator function that'll use its closure to control whether
 * or not fork request should be accepted or ignored. Easier to test and reason this way?
 *
 * @param  {Boolean} isTrackerInProgress
 * @return {Function}
 */
const tracker = (isTrackerInProgress = false) => {
  let trackerInProgress = isTrackerInProgress;

  return function* trackerG() {
    // no need to use `cancel` effect, we'll piggy pack on the current fork
    if (trackerInProgress === true) {
      return;
    }

    trackerInProgress = true;

    while (wolfCola[wolfCola.playingKey] !== null && wolfCola[wolfCola.playingKey].playing()) {
      // current playback progress
      yield put(playbackPosition(wolfCola[wolfCola.playingKey].seek()));

      if (wolfCola.crossfadeInProgress === false) {
        const stateCheck = yield select();

        // checking for crossfade threshold...
        if ((stateCheck.duration - stateCheck.playbackPosition) <= stateCheck.crossfade) {
          yield put({ type: NEXT });
        }
      }

      yield call(delay, 1000);
    }

    trackerInProgress = false;
  };
};

// #BOOM #POP-POP
// it's easier to reason about with an enclosed variable than inside `wolfCola`
// `wolfCola` will only deal with Howl stuff
const trackerSaga = tracker(false);

function* play(action) {
  const state = yield select();
  const { payload } = action;

  // same song can be in different playlist hence the "optimization" has to be removed
  yield put(initialQueue(payload.initialQueue));
  yield put(queueSet(payload.queue));
  if (state.shuffle === true) {
    yield put(queueRemove(payload.queue.findIndex(song => song.track_id === payload.play.track_id)));
  }
  yield put(current(payload.play));

  if (state.crossfade === 0) { // crossfade is off - clearing any Howl event
    if (wolfCola.current !== null) {
      wolfCola.current.off();
      wolfCola.current.unload();
      wolfCola.current = null;
    }

    if (wolfCola.next !== null) {
      wolfCola.next.off();
      wolfCola.next.unload();
      wolfCola.next = null;
    }
    // 👇 checking for crossfade and initializing. `state.crossfade` > 0 here
  } else if (wolfCola.crossfadeInProgress === false && state.playing === true) {
    if (wolfCola.current !== null) {
      wolfCola.crossfadeInProgress = true;
      wolfCola.current.fade(1, 0, (state.crossfade * 1000));
      // firing `off` and clearing `howlerEnd` fork - avoiding double NEXT #3
      wolfCola.current.off();
      // on fade completion we'll clear the faded song
      wolfCola.current.once('fade', () => {
        if (wolfCola.current !== null) {
          wolfCola.current.unload();
          wolfCola.current = null;
          wolfCola.crossfadeInProgress = false;
        }
      });
    }

    if (wolfCola.next !== null) {
      wolfCola.crossfadeInProgress = true;
      wolfCola.next.fade(1, 0, (state.crossfade * 1000));
      wolfCola.next.off();
      wolfCola.next.once('fade', () => {
        if (wolfCola.next !== null) {
          wolfCola.next.unload();
          wolfCola.next = null;
          wolfCola.crossfadeInProgress = false;
        }
      });
    }
    // 👇 `PLAY` triggered while crossfade in progress
  } else if (wolfCola.crossfadeInProgress === true && state.playing === true) {
    if (wolfCola.current !== null) {
      wolfCola.current.off();
      wolfCola.current.unload();
      wolfCola.current = null;
    }

    if (wolfCola.next !== null) {
      wolfCola.next.off();
      wolfCola.next.unload();
      wolfCola.next = null;
    }

    wolfCola.crossfadeInProgress = false;
  }

  // resetting to avoid the quick jump when next song is started
  yield put(playbackPosition(0));

  // picking `playingKey`...
  if (wolfCola.current === null && wolfCola.next === null) {
    wolfCola.playingKey = 'current';
  } else {
    wolfCola.playingKey = wolfCola.current === null ? 'current' : 'next';
  }

  yield put(loading(true));

  // playing the song - each song will have a Single Howler object that'll be
  // destroyed after each playback - loading all songs (i.e. queue can be costly - I think)
  // single Howler music approach:
  // - single song ID whenever it's called
  // - light [no preparation until asked]
  wolfCola[wolfCola.playingKey] = new Howl({
    src: [`${BASE_S3}${payload.play.track_track.s3_name}`],
    html5: true,
    autoplay: true,
    format: ['mp3'],
  });

  // ethio-telecom
  yield fork(howlerLoadError, wolfCola.playingKey);
  // if load doesn't resolve Wolf-Cola won't start
  yield promiseifyHowlEvent(wolfCola[wolfCola.playingKey], 'load');
  // music loaded
  yield put(loading(false));
  // music loaded, setting duration
  // eslint-disable-next-line
  yield put(duration(Number.isFinite(wolfCola[wolfCola.playingKey].duration()) ? wolfCola[wolfCola.playingKey].duration() : payload.play.track_track.s3_meta.duration));
  // setting playing - USING Howler object [autoplay]
  yield put(playing(wolfCola[wolfCola.playingKey].playing()));
  // fork for `end` lister [with channel]
  yield fork(howlerEnd, wolfCola.playingKey);
  yield fork(trackerSaga);
}

function* seek(action) {
  yield call(delay, 64);
  const { payload } = action;
  yield put(playbackPosition(payload));

  if (wolfCola[wolfCola.playingKey] !== null) {
    wolfCola[wolfCola.playingKey].seek(payload);
  }
}

function* next() {
  const state = yield select();

  // nothing playing - halting...
  if (state.playing === false) {
    return;
  }

  // repeat one whatever was playing...
  if (state.repeat === 'ONE') {
    yield put({
      type: PLAY,
      payload: {
        play: state.current,
        queue: state.queue,
        initialQueue: state.initialQueue,
      },
    });

    return;
  }

  // end of music - no music left; setting "no music" state...
  if (state.queue.length === 0 && state.repeat === 'OFF') {
    yield put(duration(0));
    yield put(playbackPosition(0));
    yield put(playing(false));
    yield put(current(null));
    return;
  }

  // PUSH-ing song to history...
  if (state.current !== null) {
    const historyIndex = state.history.findIndex(song => song.track_id === state.current.track_id);

    if (historyIndex === -1) {
      yield put(historyPush(state.current));
    } else {
      yield put(historyFront(historyIndex));
    }
  }

  // played through the entire queue and repeat is `ALL`
  if (state.queue.length === 0 && state.repeat === 'ALL') {
    const nextPlayIndex = state.shuffle ? random(0)(state.initialQueue.length - 1) : 0;

    yield put({
      type: PLAY,
      payload: {
        play: state.initialQueue[nextPlayIndex],
        queue: state.initialQueue,
        initialQueue: state.initialQueue,
      },
    });

    return;
  }

  // repeat is `OFF | ALL`, there are items in queue; picking next item according to shuffle...
  if (state.shuffle) {
    const nextPlayIndex = random(0)(state.queue.length - 1);

    yield put({
      type: PLAY,
      payload: {
        play: state.queue[nextPlayIndex],
        queue: state.queue,
        initialQueue: state.initialQueue,
      },
    });

    return;
  }

  // `nextPlayIndex` will not be -1 on `findIndex`
  let nextPlayIndex = state.initialQueue.findIndex(song => song.track_id === state.current.track_id) + 1;

  if (nextPlayIndex === state.initialQueue.length) {
    if (state.repeat === 'ALL') {
      nextPlayIndex = 0;
    } else {
      // killing...
      // crossroading will not be applied here as there's nothing to crossfade-to
      wolfCola[wolfCola.playingKey].off();
      wolfCola[wolfCola.playingKey].unload();
      wolfCola[wolfCola.playingKey] = null;
      wolfCola.crossfadeInProgress = false;

      // yield my beer...
      yield put(duration(0));
      yield put(playbackPosition(0));
      yield put(playing(false));
      yield put(current(null));

      return;
    }
  }

  yield put({
    type: PLAY,
    payload: {
      play: state.initialQueue[nextPlayIndex],
      queue: state.initialQueue,
      initialQueue: state.initialQueue,
    },
  });
}

function* previous() {
  const state = yield select();

  // nothing playing - halting...
  if (state.playing === false) {
    return;
  }

  // repeat `ONE`
  // previous triggered while crossfade > playbackPosition
  if (state.repeat === 'ONE' || (state.playbackPosition > PREVIOUS_THRESHOLD && state.crossfade > state.playbackPosition)) {
    yield put({
      type: PLAY,
      payload: {
        play: state.current,
        queue: state.queue,
        initialQueue: state.initialQueue,
      },
    });

    return;
  }

  // history is empty || the current song being played is the same as the *one* item in history
  if (state.history.length === 0 || playingLastHistory(state)) {
    wolfCola[wolfCola.playingKey].off();
    wolfCola[wolfCola.playingKey].unload();
    wolfCola[wolfCola.playingKey] = null;

    yield put(duration(0));
    yield put(playbackPosition(0));
    yield put(playing(false));
    yield put(current(null));
    return;
  }

  // POP-ing song from history...
  const historyIndex = state.history.findIndex(song => song.track_id === state.history[0].track_id);

  if (historyIndex !== -1) {
    yield put(historyPop(historyIndex));
  }

  // witchcraft!
  yield put({
    type: PLAY,
    payload: {
      play: state.history[0],
      queue: state.shuffle ? [state.history[0], ...state.queue] : [...state.initialQueue],
      initialQueue: state.initialQueue,
    },
  });
}

function* togglePlayPause() {
  const state = yield select();

  // nothing to pause play here, halting...
  if (state.current === null) {
    return;
  }

  // pausing...
  if (state.playing === true) {
    if (wolfCola.current !== null) {
      wolfCola.current.pause();
    }

    if (wolfCola.next !== null) {
      wolfCola.next.pause();
    }

    yield put(playing(false));

    return;
  }

  // playing...
  if (wolfCola.current !== null) {
    wolfCola.current.play();
  }

  if (wolfCola.next !== null) {
    wolfCola.next.play();
  }

  yield put(playing(wolfCola[wolfCola.playingKey].playing()));
  yield fork(trackerSaga);
}

function* watchPlay() {
  yield throttle(1000, PLAY, play);
}

function* watchSeek() {
  yield takeLatest(SEEK, seek);
}

function* watchNext() {
  yield throttle(1000, NEXT, next);
}

function* watchPrevious() {
  yield throttle(1000, PREVIOUS, previous);
}

function* watchTogglePlayPause() {
  yield takeEvery(TOGGLE_PLAY_PAUSE, togglePlayPause);
}

module.exports = {
  watchPlay,
  watchPrevious,
  watchNext,
  watchSeek,
  watchTogglePlayPause,
};
