/* eslint no-console: off */

import { put, takeEvery } from 'redux-saga/effects';

import { SET_PLAYING } from '@app/redux/constant/playing';

import { playing } from '@app/redux/action/playing';

function* setPlaying(action) {
  yield put(playing(action.payload));
}

function* watchSetPlaying() {
  yield takeEvery(SET_PLAYING, setPlaying);
}

module.exports = {
  watchSetPlaying,
};
