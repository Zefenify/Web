import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';

import store from '@app/redux/store';
import { CONTEXT_MENU_OFF_REQUEST } from '@app/redux/constant/contextMenu';
import { SONG_SAVE_REQUEST, SONG_REMOVE_REQUEST } from '@app/redux/constant/song';

import DJKhaled from '@app/component/hoc/DJKhaled';
import ContextMenu from '@app/component/presentational/ContextMenu';

const closeContextMenu = () => {
  const { contextMenu } = store.getState();

  if (contextMenu === null) {
    return;
  }

  store.dispatch({
    type: CONTEXT_MENU_OFF_REQUEST,
  });
};

const songSave = (track) => {
  store.dispatch({
    type: SONG_SAVE_REQUEST,
    payload: track,
  });
};

const songRemove = (track) => {
  store.dispatch({
    type: SONG_REMOVE_REQUEST,
    payload: track,
  });
};

const ContextMenuContainer = props => (<ContextMenu
  {...props}
  closeContextMenu={closeContextMenu}
  songSave={songSave}
  songRemove={songRemove}
/>);

// NOTE:
// `history` prop comes from React Router not state
// clash-alaregem
// to prevent future name collision TODO: rename `history` state entry
module.exports = DJKhaled(withRouter(connect(state => ({
  contextMenu: state.contextMenu,
  user: state.user,
  song: state.song,
}))(ContextMenuContainer)));
