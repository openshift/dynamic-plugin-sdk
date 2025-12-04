import {
  Button,
  Content,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import * as React from 'react';
import type { LoadPluginModalRefProps } from './LoadPluginModal';
import LoadPluginModal from './LoadPluginModal';

const PageHeader: React.FC = () => {
  const loadPluginModalRef = React.useRef<LoadPluginModalRefProps>(null);

  const openLoadPluginModal = () => {
    loadPluginModalRef.current?.open();
  };

  return (
    <Masthead>
      <MastheadMain>
        <MastheadBrand>
          <Content component="h1">{document.title}</Content>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup align={{ default: 'alignEnd' }}>
              <ToolbarItem>
                <Button
                  variant="primary"
                  onClick={openLoadPluginModal}
                  data-test-id="plugin-modal-open"
                >
                  Load plugin
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
