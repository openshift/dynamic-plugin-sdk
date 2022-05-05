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

/**
 * This is an example on how to consume extensions contributed by plugins.
 *
 * The `useExtensions` hook returns extensions which are currently in use, without any further
 * transformations. Its argument is a predicate function that filters extensions based on their
 * `type`.
 *
 * The `useResolvedExtensions` hook extends the `useExtensions` functionality by transforming
 * the properties of matching extensions, resolving all `CodeRef<T>` functions into `T` values.
 * This resolution is inherently asynchronous, so the hook provides the `resolved` flag which
 * indicates the completion of the code reference resolution.
 */
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
