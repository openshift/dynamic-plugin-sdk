/* eslint-disable no-console */
import * as React from 'react';
import { getK8sResourceURL, WebSocketFactory } from '@openshift/dynamic-plugin-sdk-utils';
import PrintObject from './PrintObject';
import { Alert, Button, Title } from '@patternfly/react-core';
import WSLoadingState from './WSLoadingState';
import { ApplicationModel } from './models';

type WSTestProps = {
  namespace: string;
};

const WSTest: React.FC<WSTestProps> = ({ namespace }) => {
  const [r, setR] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [isOpen, setOpen] = React.useState(false);
  const [path, setPath] = React.useState<string>();

  React.useEffect(() => {
    let ws: WebSocketFactory;
    if (path) {
      let safePath = path;
      if (/^\/\//.test(path)) {
        // https://github.com/openshift/dynamic-plugin-sdk/pull/55
        safePath = path.slice(1);
      }
      ws = new WebSocketFactory('sample websocket', {
        path: safePath,
      });
      ws.onOpen(() => {
        setOpen(true);
      });
      ws.onError((data) => {
        console.debug('error', data);
      });
      ws.onMessage((dataStringOrObject) => {
        try {
          let data;
          if (typeof dataStringOrObject === 'string') {
            data = JSON.parse(dataStringOrObject);
          } else {
            data = dataStringOrObject;
          }
          const { type, object } = data || {}; // current structure
          switch (type) {
            case 'DELETED':
              setR(null);
              break;
            default:
              setR(object);
          }
          console.debug('message', type, object);
        } catch (e) {
          console.error('>>> Web Socket Data Bad', e);
          setError('Web Socket data unknown structure');
          return;
        }
      });
      ws.onClose((data) => {
        setOpen(false);
        setR(null);
        setPath(undefined);
        // https://www.rfc-editor.org/rfc/rfc6455#section-11.7
        // 1006: https://stackoverflow.com/a/19305172
        console.debug('close', data, 'code:', data.code);
      });
    }

    return () => {
      ws?.destroy();
      ws = null;
    };
  }, [path]);

  return (
    <>
      <Title headingLevel="h2" size="xl">
        Websockets
      </Title>
      <p>Needs a created Application to successfully return details.</p>
      {!path &&
        (namespace ? (
          <>
            <p>Create Web Socket Connection to:</p>
            <Button
              onClick={() => {
                setPath(getK8sResourceURL(ApplicationModel, undefined, { ns: namespace }));
              }}
              variant="primary"
            >
              Applications
            </Button>
          </>
        ) : (
          <p>Need a namespace</p>
        ))}
      <WSLoadingState socketBeingCreated={!!path} socketOpen={isOpen} resourceLoaded={!!r} />
      {isOpen && !r && <p>No response -- did you create the Application?</p>}
      {error && (
        <Alert variant="danger" title="Websocket Error">
          {error}
        </Alert>
      )}
      {r && <PrintObject object={r} />}
    </>
  );
};

export default WSTest;
