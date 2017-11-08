/* eslint no-console: off */
/* eslint no-underscore-dangle: off */

import localforage from 'localforage';
import { put, select, takeEvery } from 'redux-saga/effects';

import { LF_STORE } from '@app/config/localforage';
import { REMAINING_REQUEST } from '@app/redux/constant/remaining';

import { remaining } from '@app/redux/action/remaining';

function* remainingBootFromLF() {
  try {
    const lfRemaining = yield localforage.getItem(LF_STORE.REMAINING);
    yield put(remaining(lfRemaining || false));
  } catch (err) {
    console.warn('Unable to boot remaining from LF', err);
  }
}

function* _remaining() {
  const state = yield select();
  yield put(remaining(!state.remaining));

  try {
    yield localforage.setItem(LF_STORE.REMAINING, !state.remaining);
  } catch (err) {
    console.warn('Unable to save remaining state to LF', err);
  }
}

function* remainingRequest() {
  yield takeEvery(REMAINING_REQUEST, _remaining);
}

module.exports = {
  remainingBootFromLF,
  remainingRequest,
};
