/* global document */

import React, { Component } from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router, Route, Link, Redirect, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'emotion-theming';

import '@app/component/styled/Global';

import '@app/util/facebook';
import store from '@app/redux/store';
import { themeLight, themeDark } from '@app/config/theme';

import HomeContainer from '@app/component/container/HomeContainer';
import SettingsContainer from '@app/component/container/SettingsContainer';
import ControlContainer from '@app/component/container/ControlContainer';
import PlaylistContainer from '@app/component/container/PlaylistContainer';
import ArtistContainer from '@app/component/container/ArtistContainer';
import AlbumContainer from '@app/component/container/AlbumContainer';
import RecentContainer from '@app/component/container/RecentContainer';
import SongsContainer from '@app/component/container/SongsContainer';
import AlbumsContainer from '@app/component/container/AlbumsContainer';
import ArtistsContainer from '@app/component/container/ArtistsContainer';
import TrendingContainer from '@app/component/container/TrendingContainer';
import SearchContainer from '@app/component/container/SearchContainer';
import CollectionContainer from '@app/component/container/CollectionContainer';
import ContextMenuContainer from '@app/component/container/ContextMenuContainer';
import ContextOverlayContainer from '@app/component/container/ContextOverlayContainer';
import NotificationContainer from '@app/component/container/NotificationContainer';

import Divider from '@app/component/styled/Divider';
import Spinner from '@app/component/presentational/Spinner';
import Mobile from '@app/component/presentational/Mobile';
import { Search, Trending, Settings } from '@app/component/presentational/SVG';

import DJKhaled from '@app/component/hoc/DJKhaled';
import { WolfColaContainer, NavListContainer, NavContainer, RouteContainer } from '@app/component/styled/WolfCola';
import { NavLinkStyled } from '@app/component/styled/ReactRouter';

class WolfCola extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      theme: 'dark',
    };
  }

  componentDidMount() {
    this.unsubscribe = store.subscribe(() => {
      const state = store.getState();
      this.setState(() => ({
        loading: state.loading,
        theme: state.theme,
      }));
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return (
      <Provider store={store}>
        <ThemeProvider theme={this.state.theme === 'light' ? themeLight : themeDark}>
          <Router>
            <div>
              <WolfColaContainer id="wolf-cola-container">
                <NavListContainer>
                  <NavContainer>
                    <Link className="brand" to="/">
                      <img className="brand-img" alt="zefenify logo" src="static/image/zefenify.png?e88e2eec0ae92125c988" />
                      <span>Zefenify</span>
                      <Spinner loading={this.state.loading} />
                    </Link>

                    <div className="nav-list">
                      <NavLinkStyled to="/search">
                        <span>Search</span>
                        <Search style={{ float: 'right' }} />
                      </NavLinkStyled>
                      <NavLinkStyled to="/trending/yesterday">
                        <span>Trending</span>
                        <Trending style={{ float: 'right' }} />
                      </NavLinkStyled>
                      <NavLinkStyled to="/collection">Genres &amp; Moods</NavLinkStyled>

                      <Divider padding="1em 0.5em 1em 2em" fontSize="0.75em">YOUR MUSIC&nbsp;</Divider>
                      <NavLinkStyled to="/recent">Recently Played</NavLinkStyled>
                      <NavLinkStyled to="/songs">Songs</NavLinkStyled>
                      <NavLinkStyled to="/albums">Albums</NavLinkStyled>
                      <NavLinkStyled to="/artists">Artists</NavLinkStyled>

                      <Divider padding="1em 0.5em 1em 2em" fontSize="0.75em">SETTINGS&nbsp;</Divider>
                      <NavLinkStyled to="/settings">
                        <span>Settings</span>
                        <Settings style={{ float: 'right' }} />
                      </NavLinkStyled>
                      <div style={{ paddingBottom: '2em' }} />
                    </div>
                  </NavContainer>

                  <RouteContainer>
                    <Switch>
                      <Route exact path="/" component={HomeContainer} />
                      <Route exact path="/:type(playlist|featured)/:id" component={PlaylistContainer} />
                      <Route exact path="/artist/:id" component={ArtistContainer} />
                      <Route exact path="/album/:id/:trackId?" component={AlbumContainer} />
                      <Route exact path="/search" component={SearchContainer} />
                      <Route exact path="/trending/:category(yesterday|today|week|popularity)" component={TrendingContainer} />
                      <Route exact path="/collection/:id?" component={CollectionContainer} />
                      <Route exact path="/recent" component={RecentContainer} />
                      <Route exact path="/songs" component={SongsContainer} />
                      <Route exact path="/albums/:id?" component={AlbumsContainer} />
                      <Route exact path="/artists/:id?" component={ArtistsContainer} />
                      <Route exact path="/settings" component={SettingsContainer} />
                      <Redirect exact push={false} from="/trending" to="/trending/yesterday" />
                      <Redirect push={false} to="/" />
                    </Switch>

                    <NotificationContainer />
                  </RouteContainer>
                </NavListContainer>

                <ControlContainer />
              </WolfColaContainer>

              <Mobile />
              <ContextOverlayContainer />
              <ContextMenuContainer />
            </div>
          </Router>
        </ThemeProvider>
      </Provider>
    );
  }
}

const WolfColaDJKhaled = DJKhaled(WolfCola);

render(<WolfColaDJKhaled />, document.querySelector('#wolf-cola'));
