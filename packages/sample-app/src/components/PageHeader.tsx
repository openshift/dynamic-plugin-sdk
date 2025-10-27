import { usePluginStore } from '@openshift/dynamic-plugin-sdk';
import {
  Brand,
  Button,
  Masthead,
  MastheadToggle,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons';
import * as React from 'react';
import pfLogo from '../images/pfColorLogo.svg';
import LoadPluginModal from './LoadPluginModal';
import type { LoadPluginModalRefProps } from './LoadPluginModal';

const PageHeader: React.FC = () => {
  const loadPluginModalRef = React.useRef<LoadPluginModalRefProps>(null);
  const pluginStore = usePluginStore();

  const openLoadPluginModal = () => {
    loadPluginModalRef.current?.open();
  };

  const manuallyLoadPlugin = () => {
    pluginStore.manuallyAddPlugin({
      name: 'manual-plugin',
      version: '0.0.0',
      extensions: [
        {
          type: 'core.telemetry/listener',
          properties: {
            listener: () => import('./manualPlugin').then((m) => m.default),
          },
          flags: {
            required: ['TELEMETRY_FLAG'],
            disallowed: [],
          },
        },
      ],
    });
  };

  return (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton variant="plain">
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <Brand src={pfLogo} alt="PatternFly logo" />
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem variant="label">{document.title}</ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup variant="button-group" alignment={{ default: 'alignRight' }}>
              <ToolbarItem>
                <Button
                  variant="primary"
                  onClick={openLoadPluginModal}
                  data-test-id="plugin-modal-open"
                >
                  Load plugin
                </Button>
              </ToolbarItem>
              <ToolbarItem>
                <Button
                  variant="secondary"
                  onClick={manuallyLoadPlugin}
                  data-test-id="manual-plugin-load"
                >
                  Manually add plugin
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
      <LoadPluginModal ref={loadPluginModalRef} />
    </Masthead>
  );
};

export default PageHeader;
