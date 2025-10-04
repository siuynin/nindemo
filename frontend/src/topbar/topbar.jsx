import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Navbar,
  Alignment,
  AnchorButton,
  NavbarDivider,
  EditableText,
  Popover,
  Button,
  Menu,
  MenuItem,
} from '@blueprintjs/core';

import FaGithub from '@meronex/icons/fa/FaGithub';
import FaDiscord from '@meronex/icons/fa/FaDiscord';
import FaTwitter from '@meronex/icons/fa/FaTwitter';
import BiCodeBlock from '@meronex/icons/bi/BiCodeBlock';
import MdcCloudAlert from '@meronex/icons/mdc/MdcCloudAlert';
import MdcCloudCheck from '@meronex/icons/mdc/MdcCloudCheck';
import MdcCloudSync from '@meronex/icons/mdc/MdcCloudSync';
import styled from 'polotno/utils/styled';
import AuthModal from 'components/AuthModal';
import ProfileModal from 'components/ProfileModal';

import { useProject } from '../project';
import { t } from '../translations';

import { FileMenu } from './file-menu';
import { DownloadButton } from './download-button';
import { PostProcessButton } from './post-process-button'; 
import { CloudWarning } from '../cloud-warning';

const NavbarContainer = styled('div')`
  white-space: nowrap;

  @media screen and (max-width: 500px) {
    overflow-x: auto;
    overflow-y: hidden;
    max-width: 100vw;
  }
`;

const NavInner = styled('div')`
  @media screen and (max-width: 500px) {
    display: flex;
  }
`;

const Status = observer(({ project }) => {
  const Icon = !project.cloudEnabled
    ? MdcCloudAlert
    : project.status === 'saved'
    ? MdcCloudCheck
    : MdcCloudSync;
  return (
    <Popover
      content={
        <div style={{ padding: '10px', maxWidth: '300px' }}>
          {!project.cloudEnabled && (
            <CloudWarning style={{ padding: '10px' }} />
          )}
          {project.cloudEnabled && project.status === 'saved' && (
            <>
              You data is saved with{' '}
              <a href="https://puter.com" target="_blank">
                Puter.com
              </a>
            </>
          )}
          {project.cloudEnabled &&
            (project.status === 'saving' || project.status === 'has-changes') &&
            'Saving...'}
        </div>
      }
      interactionKind="hover"
    >
      <div style={{ padding: '0 5px' }}>
        <Icon className="bp5-icon" style={{ fontSize: '25px', opacity: 0.8 }} />
      </div>
    </Popover>
  );
});

export default observer(({ store }) => {
  const project = useProject();
  
  // State management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Verify token and get user info
          const response = await fetch('/api/user', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('authToken');
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Event handlers
  const toggleAccountDropdown = () => {
    setIsAccountDropdownOpen(!isAccountDropdownOpen);
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setIsAccountDropdownOpen(false);
  };

  const handleLoginClick = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleRegisterClick = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
      setIsAuthenticated(false);
      setIsAccountDropdownOpen(false);
    }
  };

  const userMenu = (
    <Menu>
      <MenuItem
        text={t.topbar?.profile || 'Profile'}
        onClick={handleProfileClick}
      />
      <MenuItem
        text="User Credit"
        onClick={() => window.location.href = '/user-credit'}
      />
      <MenuItem
        text={t.topbar?.logout || 'Logout'}
        onClick={handleLogout}
      />
    </Menu>
  );

  return (
    <NavbarContainer className="bp5-navbar topbar">
      <NavInner>
        <Navbar.Group align={Alignment.LEFT}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 16px',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="20" height="20" fill="white" />
            </svg>
            <span
              style={{
                fontWeight: 500,
                fontSize: '21px',
                lineHeight: '100%',
                letterSpacing: '0.25px',
              }}
            >
              AI Studio
            </span>
          </div>
          <NavbarDivider />
          <FileMenu store={store} project={project} />
          <div
            style={{
              paddingLeft: '20px',
              maxWidth: '200px',
            }}
          >
            <EditableText
              value={window.project.name}
              placeholder="Design name"
              onChange={(name) => {
                window.project.name = name;
                window.project.requestSave();
              }}
            />
          </div>
        </Navbar.Group>
        <Navbar.Group align={Alignment.RIGHT}>
          {/* <Status project={project} /> */}

          <AnchorButton href="https://polotno.com" target="_blank" minimal>
            For developers
          </AnchorButton>
          
          <NavbarDivider />
          <PostProcessButton store={store} />
          <DownloadButton store={store} />
          
          {/* User Authentication Section */}
          {isAuthenticated ? (
            <Popover content={userMenu} position="bottom-right">
              <Button
                minimal
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#007aff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  {user?.name || user?.email}
                </span>
              </Button>
            </Popover>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                minimal
                onClick={handleLoginClick}
                style={{ fontSize: '14px' }}
              >
                {t.topbar?.login || 'Login'}
              </Button>
              <Button
                intent="primary"
                onClick={handleRegisterClick}
                style={{ fontSize: '14px' }}
              >
                {t.topbar?.register || 'Register'}
              </Button>
            </div>
          )}
        </Navbar.Group>
      </NavInner>

      {/* Modals */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          mode={authModalMode}
          onSwitchMode={(mode) => setAuthModalMode(mode)}
        />
      )}
    </NavbarContainer>
  );
});
