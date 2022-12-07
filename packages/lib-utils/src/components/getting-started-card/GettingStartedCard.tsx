import {
  Button,
  Card,
  CardActions,
  CardBody,
  CardHeader,
  CardTitle,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { CloseIcon } from '@patternfly/react-icons';
import * as React from 'react';
import '@patternfly/react-styles/css/utilities/Display/display.css';
import '@patternfly/react-styles/css/utilities/Spacing/spacing.css';
import { useLocalStorage } from '../../hooks';

export type GettingStartedCardProps = {
  cardClassName?: string;
  imgAlt?: string;
  imgClassName?: string;
  imgSrc?: string;
  isDismissable?: boolean;
  localStorageKey: string;
  title: string;
};

const LOCAL_STORAGE_KEY = 'getting-started-card';

const GettingStartedCard: React.FC<GettingStartedCardProps> = ({
  cardClassName,
  children,
  imgAlt = '',
  imgClassName,
  imgSrc,
  isDismissable = true,
  localStorageKey,
  title,
}) => {
  const [storageKeys, setStorageKeys] =
    useLocalStorage<{ [key: string]: boolean }>(LOCAL_STORAGE_KEY);

  const keys = storageKeys && typeof storageKeys === 'object' ? storageKeys : {};
  const isDismissed = keys[localStorageKey];

  return !isDismissed ? (
    <Card className={cardClassName}>
      <Split>
        {imgSrc && (
          <SplitItem className={imgClassName}>
            <img src={imgSrc} alt={imgAlt} />
          </SplitItem>
        )}
        <SplitItem isFilled>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {isDismissable && (
              <CardActions>
                <Button
                  variant="plain"
                  aria-label="Hide card"
                  onClick={() => setStorageKeys({ ...keys, [localStorageKey]: true })}
                >
                  <CloseIcon />
                </Button>
              </CardActions>
            )}
          </CardHeader>
          <CardBody>{children}</CardBody>
        </SplitItem>
      </Split>
    </Card>
  ) : null;
};

export default GettingStartedCard;
