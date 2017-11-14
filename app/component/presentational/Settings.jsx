import React from 'react';
import { func, string, number, shape } from 'prop-types';
import styled from 'react-emotion';

import Button from '@app/component/styled/Button';
import Divider from '@app/component/styled/Divider';
import Range from '@app/component/styled/Range';

const SettingsContainer = styled.div`
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 1em;
    margin-bottom: 6em;

    &__name {
      padding: 0.1em 0;
      font-size: 1.5em;
    }

    &__logout {
      width: 100px;
      margin-top: 0.75em;
    }
  }

  .crossfade {
    padding: 0;
    width: 75%;
    max-width: 250px;
    margin-top: 1em;
    margin-bottom: 4em;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .crossfade {
    padding: 0;
    width: 75%;
    max-width: 250px;
    margin-top: 1em;
    margin-bottom: 4em;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .dmca {
    padding: 0 1em;
    border: 1px solid red;
  }
`;

const DMCA = styled.a`
  text-decoration: none;
  color: #ff6d5e;
  border-radius: 2em;
  padding: 0.75em 2.75em;
  font-size: 1em;
  margin-bottom: 1em;
  border: 1px solid ${props => props.theme.listText};
`;

const Settings = ({
  currentTheme,
  currentCrossfade,
  crossfade,
  toggleTheme,
  login,
  logout,
  user,
}) => {
  const crossfadeMessage = `Crossfade: ${currentCrossfade === 0 ? 'Off' : `${currentCrossfade} Second${currentCrossfade > 1 ? 's' : ''}`}`;

  if (user === null) {
    return (
      <SettingsContainer>
        <h1>Settings</h1>

        <Divider />

        <Button style={{ marginTop: '2em', marginBottom: '5em' }} onClick={login}>
          <b>Login with Facebook</b>
        </Button>

        <Button style={{ marginBottom: '0.5em' }} onClick={toggleTheme}>Change Theme</Button>

        <small>
          <span>Current theme is </span><b>{ currentTheme === 'light' ? 'Dayman' : 'Nightman' }</b>
        </small>

        <div className="crossfade">
          <h3>{ crossfadeMessage }</h3>

          <Range
            type="range"
            onChange={e => crossfade(e)}
            value={currentCrossfade}
            min="0"
            max="12"
            step="1"
          />
        </div>

        <DMCA href="/dmca.html" target="_blank">DMCA</DMCA>
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer>
      <h1>Settings</h1>

      <Divider />

      <div className="user-info">
        <small>Logged in as</small>
        <div className="user-info__name">{ user.user.user_full_name }</div>
        <Button className="user-info__logout" onClick={logout}>Logout</Button>
      </div>

      <Button style={{ marginBottom: '0.5em' }} onClick={toggleTheme}>Change Theme</Button>

      <small>
        <span>Current theme is </span><b>{ currentTheme === 'light' ? 'Dayman' : 'Nightman' }</b>
      </small>

      <div className="crossfade">
        <h3>{ crossfadeMessage }</h3>

        <Range
          type="range"
          onChange={e => crossfade(e)}
          value={currentCrossfade}
          min="0"
          max="12"
          step="1"
        />
      </div>

      <DMCA href="/dmca.html" target="_blank">DMCA</DMCA>
    </SettingsContainer>
  );
};

Settings.propTypes = {
  currentTheme: string,
  user: shape({}),
  currentCrossfade: number,
  toggleTheme: func.isRequired,
  crossfade: func.isRequired,
  login: func.isRequired,
  logout: func.isRequired,
};

Settings.defaultProps = {
  currentTheme: 'light',
  currentCrossfade: 0,
  user: null,
};

module.exports = Settings;
