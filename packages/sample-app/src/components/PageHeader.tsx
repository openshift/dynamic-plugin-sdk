import { usePluginStore, useFeatureFlag } from '@openshift/dynamic-plugin-sdk';
import type { ToggleGroupItemProps } from '@patternfly/react-core';
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
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import { FlagIcon, VialIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { localPluginManifests } from '../local-plugins';
import type { LoadPluginModalRefProps } from './LoadPluginModal';
import LoadPluginModal from './LoadPluginModal';

const PageHeader: React.FC = () => {
  const pluginStore = usePluginStore();

  const loadPluginModalRef = React.useRef<LoadPluginModalRefProps>(null);

  const [sampleFeatureFlag, setSampleFeatureFlag] = useFeatureFlag('SAMPLE_FLAG');

  const openLoadPluginModal = () => {
    loadPluginModalRef.current?.open();
  };

  const loadLocalPlugins = React.useCallback(() => {
    localPluginManifests.forEach((manifest) => {
      pluginStore.loadPlugin(manifest);
    });
  }, [pluginStore]);

  const onSampleFeatureFlagChange = React.useCallback<Required<ToggleGroupItemProps>['onChange']>(
    (_e, value) => {
      setSampleFeatureFlag(value);
    },
    [setSampleFeatureFlag],
  );

  return (
    <Masthead>
      <MastheadMain>
        <MastheadBrand>
          <Content component="h1">
            <VialIcon />
            &nbsp;
            {document.title}
          </Content>
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
                  Load remote plugin
                </Button>
              </ToolbarItem>
              <ToolbarItem>
                <Button variant="secondary" onClick={loadLocalPlugins}>
                  Load local plugins
                </Button>
              </ToolbarItem>
              <ToolbarItem>
                <ToggleGroup>
                  <ToggleGroupItem
                    icon={<FlagIcon />}
                    text="SAMPLE_FLAG"
                    isSelected={sampleFeatureFlag}
                    onChange={onSampleFeatureFlagChange}
                  />
                </ToggleGroup>
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
