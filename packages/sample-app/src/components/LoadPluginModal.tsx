import { usePluginStore } from '@openshift/dynamic-plugin-sdk';
import type { CheckboxProps, FormProps, TextInputProps } from '@patternfly/react-core';
import {
  Button,
  Checkbox,
  Form,
  FormGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextInput,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { isValidURL } from '../utils';

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

    const onManifestURLChange = React.useCallback<Required<TextInputProps>['onChange']>(
      (_e, value) => {
        setManifestURL(value);
        setManifestURLValid(isValidURL(value));
      },
      [setManifestURL, setManifestURLValid],
    );

    const onForceReloadChange = React.useCallback<Required<CheckboxProps>['onChange']>(
      (_e, value) => {
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

    const onSubmit = React.useCallback<Required<FormProps>['onSubmit']>(
      (e) => {
        e.preventDefault();
        loadPlugin();
      },
      [loadPlugin],
    );

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
        isOpen={isModalOpen}
        onClose={closeModal}
        aria-labelledby="load-plugin-title"
        aria-describedby="load-plugin-description"
      >
        <ModalHeader
          title="Load plugin"
          description="Load a plugin from the provided manifest."
          labelId="load-plugin-title"
          descriptorId="load-plugin-description"
        />
        <ModalBody>
          <Form id="load-plugin-form" onSubmit={onSubmit}>
            <FormGroup fieldId="plugin-manifest-url" label="Manifest URL" isRequired>
              <TextInput
                id="plugin-manifest-url"
                type="text"
                isRequired
                value={manifestURL}
                onChange={onManifestURLChange}
                validated={manifestURLValid ? 'success' : 'error'}
                data-test-id="plugin-modal-url"
              />
              {!manifestURLValid && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem icon={<ExclamationCircleIcon />} variant="error">
                      Must be a valid URL
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
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
        </ModalBody>
        <ModalFooter>
          <Button
            key="load"
            variant="primary"
            onClick={loadPlugin}
            isDisabled={!manifestURLValid}
            data-test-id="plugin-modal-load"
            form="load-plugin-form"
          >
            Load
          </Button>
          <Button key="cancel" variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    );
  },
);

export default LoadPluginModal;
