/* eslint no-console: 0 */
/* eslint no-underscore-dangle: off */

import localforage from 'localforage';
import { put, select, takeEvery } from 'redux-saga/effects';

import { LF_STORE } from '@app/config/localforage';
import { REPEAT_REQUEST } from '@app/redux/constant/repeat';

import { repeat } from '@app/redux/action/repeat';

function* repeatBootFromLF() {
  try {
    const lfRepeat = yield localforage.getItem(LF_STORE.REPEAT);
    yield put(repeat(lfRepeat === null ? 'OFF' : lfRepeat));
  } catch (err) {
    console.warn('Unable to boot repeat from LF', err);
  }
}

function* _repeat() {
  const state = yield select();
  const nextRepeatModeMapper = { OFF: 'ALL', ALL: 'ONE', ONE: 'OFF' };
  yield put(repeat(nextRepeatModeMapper[state.repeat] || 'OFF'));

  try {
    yield localforage.setItem(LF_STORE.REPEAT, nextRepeatModeMapper[state.repeat] || 'OFF');
  } catch (err) {
    console.warn('Unable to save repeat state to LF', err);
  }
}

function* repeatRequest() {
  yield takeEvery(REPEAT_REQUEST, _repeat);
}

module.exports = {
  repeatBootFromLF,
  repeatRequest,
};
