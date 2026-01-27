import { useExtensions, useResolvedExtensions } from '@openshift/dynamic-plugin-sdk';
import type { LoadedExtension, LoadedAndResolvedExtension } from '@openshift/dynamic-plugin-sdk';
import {
  Card,
  CardTitle,
  CardBody,
  CardFooter,
  Gallery,
  GalleryItem,
  EmptyState,
  EmptyStateBody,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { PuzzlePieceIcon } from '@patternfly/react-icons';
import type { FC } from 'react';
import { useMemo } from 'react';
import type {
  SampleAppExtensionWithText,
  SampleAppExtensionWithComponent,
} from '../sample-extensions';
import {
  isSampleAppExtensionWithText,
  isSampleAppExtensionWithComponent,
} from '../sample-extensions';
import LabelWithTooltipIcon from './LabelWithTooltipIcon';
import PluginInfoTable from './PluginInfoTable';

const ExtensionCard: FC<{ extension: LoadedExtension }> = ({ extension, children }) => (
  <Card isCompact data-test-id="extension-card">
    <CardTitle data-test-id="extension-card-title">
      <LabelWithTooltipIcon
        label={extension.type}
        tooltipContent={`Extension UID: ${extension.uid}`}
      />
    </CardTitle>
    <CardBody data-test-id="extension-card-body">{children}</CardBody>
    <CardFooter data-test-id="extension-card-footer">
      Contributed by {extension.pluginName}
    </CardFooter>
  </Card>
);

/**
 * Extensions consumed via `useExtensions` hook are typed as `LoadedExtension<E>`.
 */
const TextExtensionCard: FC<{ extension: LoadedExtension<SampleAppExtensionWithText> }> = ({
  extension,
}) => (
  <ExtensionCard extension={extension}>
    <span>{extension.properties.text}</span>
  </ExtensionCard>
);

/**
 * Extensions consumed via `useResolvedExtensions` hook are typed as `LoadedAndResolvedExtension<E>`.
 */
const ComponentExtensionCard: FC<{
  extension: LoadedAndResolvedExtension<SampleAppExtensionWithComponent>;
}> = ({ extension }) => (
  <ExtensionCard extension={extension}>
    <extension.properties.component />
  </ExtensionCard>
);

/**
 * This is an example on how to consume extensions contributed by plugins.
 *
 * The `useExtensions` hook returns extensions which are currently in use without any further
 * transformations. Its argument is a predicate that filters extensions based on their `type`.
 *
 * The `useResolvedExtensions` hook extends the `useExtensions` functionality by resolving all
 * `CodeRef<T>` functions into corresponding `T` values within each extension's `properties`
 * object. This is an asynchronous operation that completes when all code references in all
 * matching extensions have been processed.
 */
export const RenderExtensions: FC = () => {
  const textExtensions = useExtensions(isSampleAppExtensionWithText);

  const [componentExtensions, componentExtensionsResolved] = useResolvedExtensions(
    isSampleAppExtensionWithComponent,
  );

  const extensionsAvailable = useMemo(
    () =>
      textExtensions.length > 0 || (componentExtensionsResolved && componentExtensions.length > 0),
    [textExtensions, componentExtensions, componentExtensionsResolved],
  );

  if (!extensionsAvailable) {
    return (
      <EmptyState titleText="No extensions currently in use" icon={PuzzlePieceIcon}>
        <EmptyStateBody>Load and enable plugins to see their extensions here.</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Gallery hasGutter>
      {textExtensions.map((e) => (
        <GalleryItem key={e.uid}>
          <TextExtensionCard extension={e} />
        </GalleryItem>
      ))}
      {componentExtensionsResolved &&
        componentExtensions.map((e) => (
          <GalleryItem key={e.uid}>
            <ComponentExtensionCard extension={e} />
          </GalleryItem>
        ))}
    </Gallery>
  );
};

const PageContent: FC = () => (
  <Stack hasGutter>
    <StackItem>
      <PluginInfoTable />
    </StackItem>
    <StackItem>
      <RenderExtensions />
    </StackItem>
  </Stack>
);

export default PageContent;
