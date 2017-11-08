/* eslint no-console: off */
/* eslint no-underscore-dangle: off */

import localforage from 'localforage';
import { put, takeEvery } from 'redux-saga/effects';

import { LF_STORE } from '@app/config/localforage';
import { CROSSFADE_REQUEST } from '@app/redux/constant/crossfade';

import { crossfade } from '@app/redux/action/crossfade';

function* crossfadeBootFromLF() {
  try {
    const lfCrossfade = yield localforage.getItem(LF_STORE.CROSSFADE);
    yield put(crossfade(lfCrossfade || 3));
  } catch (err) {
    console.warn('Unable to boot crossfade from LF', err);
  }
}

function* _crossfade(action) {
  yield put(crossfade(action.payload));

  try {
    yield localforage.setItem(LF_STORE.CROSSFADE, action.payload);
  } catch (err) {
    console.warn('Unable to save crossfade from LF', err);
  }
}

function* crossfadeRequest() {
  yield takeEvery(CROSSFADE_REQUEST, _crossfade);
}

module.exports = {
  crossfadeBootFromLF,
  crossfadeRequest,
};
