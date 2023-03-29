import { usePluginStore } from '@openshift/dynamic-plugin-sdk';
import { Button, Checkbox, Form, FormGroup, Modal, TextInput } from '@patternfly/react-core';
import * as React from 'react';
import { isValidURL } from '../../utils';

type LoadPluginModalProps = {
  defaultManifestURL?: string;
};

export type LoadPluginModalRefProps = {
  open: VoidFunction;
};

const LoadPluginModal = React.forwardRef<LoadPluginModalRefProps, LoadPluginModalProps>(
  ({ defaultManifestURL = 'http://localhost:9001/plugin-manifest.json' }, ref) => {
    const [isModalOpen, setModalOpen] = React.useState(false);

    const [manifestURL, setManifestURL] = React.useState(defaultManifestURL);
    const [manifestURLValid, setManifestURLValid] = React.useState(isValidURL(defaultManifestURL));
    const [forceReload, setForceReload] = React.useState(false);

    const pluginStore = usePluginStore();

    const onManifestURLChange = React.useCallback(
      (value: string) => {
        setManifestURL(value);
        setManifestURLValid(isValidURL(value));
      },
      [setManifestURL, setManifestURLValid],
    );

    const onForceReloadChange = React.useCallback(
      (value: boolean) => {
        setForceReload(value);
      },
      [setForceReload],
    );

    const closeModal = React.useCallback(() => {
      setModalOpen(false);
    }, [setModalOpen]);

    const loadPlugin = React.useCallback(() => {
      pluginStore.loadPlugin(manifestURL, forceReload);
      closeModal();
    }, [pluginStore, manifestURL, forceReload, closeModal]);

    React.useImperativeHandle(
      ref,
      () => ({
        open: () => {
          setModalOpen(true);
        },
      }),
      [setModalOpen],
    );

    return (
      <Modal
        variant="medium"
        title="Load plugin"
        description="Load a plugin from the provided manifest."
        showClose={false}
        isOpen={isModalOpen}
        disableFocusTrap
        actions={[
          <Button key="load" variant="primary" onClick={loadPlugin} isDisabled={!manifestURLValid}>
            Load
          </Button>,
          <Button key="cancel" variant="secondary" onClick={closeModal}>
            Cancel
          </Button>,
        ]}
      >
        <Form>
          <FormGroup
            fieldId="plugin-manifest-url"
            label="Manifest URL"
            isRequired
            helperTextInvalid="Must be a valid URL"
            validated={manifestURLValid ? 'success' : 'error'}
          >
            <TextInput
              id="plugin-manifest-url"
              type="text"
              isRequired
              value={manifestURL}
              onChange={onManifestURLChange}
              validated={manifestURLValid ? 'success' : 'error'}
            />
          </FormGroup>
          <FormGroup fieldId="plugin-load-options" label="Options">
            <Checkbox
              id="plugin-force-reload"
              label="Force reload"
              description="If the given plugin has been loaded, it will not be reloaded by default. Use this option to force plugin reload."
              isChecked={forceReload}
              onChange={onForceReloadChange}
            />
          </FormGroup>
        </Form>
      </Modal>
    );
  },
);

export default LoadPluginModal;
