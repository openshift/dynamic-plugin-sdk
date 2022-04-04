import {
  useExtensions,
  useResolvedExtensions,
  isModelFeatureFlag,
  isTelemetryListener,
} from '@openshift/dynamic-plugin-sdk';
import type { LoadedExtension } from '@openshift/dynamic-plugin-sdk';
import {
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
} from '@patternfly/react-core';
import * as React from 'react';
import PluginInfoTable from '../common/PluginInfoTable';

type ExtensionGalleryProps = {
  extensions: LoadedExtension[];
};

const ExtensionGallery: React.FC<ExtensionGalleryProps> = ({ extensions }) => (
  <Gallery hasGutter>
    {extensions.map((e) => (
      <GalleryItem key={e.uid}>
        <Card isCompact>
          <CardTitle>{e.type}</CardTitle>
          <CardBody>{e.uid}</CardBody>
        </Card>
      </GalleryItem>
    ))}
  </Gallery>
);

const TestExtensions: React.FC = () => {
  const extensions = useExtensions(isModelFeatureFlag);
  const [resolvedExtensions, resolved] = useResolvedExtensions(isTelemetryListener);
  return resolved ? <ExtensionGallery extensions={[...extensions, ...resolvedExtensions]} /> : null;
};

const MinimalAppPage: React.FC = () => (
  <Flex direction={{ default: 'column' }}>
    <FlexItem>
      <PluginInfoTable />
    </FlexItem>
    <FlexItem>
      <TestExtensions />
    </FlexItem>
  </Flex>
);

export default MinimalAppPage;
