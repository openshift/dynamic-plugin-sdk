import type { EitherNotBoth } from '@monorepo/common';
import {
  Dropdown,
  DropdownPosition,
  DropdownGroup,
  DropdownToggle,
  KebabToggle,
  DropdownItem,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash-es';
import React from 'react';
import './ActionMenu.css';

export type ActionCTA =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { callback: (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => void }
  | { href: string; external?: boolean };

export type Action = {
  /** A unique identifier for this action. */
  id: string;
  /** The label to display in the UI. */
  label: React.ReactNode;
  /** Optional subtext for the menu item */
  description?: string;
  /** Executable callback or href.
   * External links should automatically provide an external link icon on action.
   * */
  cta: ActionCTA;
  /** Optional flag to indicate whether the action is disabled. */
  isDisabled?: boolean;
  /** Optional tooltip for this action. */
  tooltip?: string;
  /** Optional icon for this action. */
  icon?: React.ReactNode;
};

export type GroupedActions = {
  /** A unique identifier for this group. */
  groupId: string;
  /** Optional label to display as group heading */
  groupLabel?: string;
  /** Actions under this group. */
  groupActions: Action[];
};

export enum ActionMenuVariant {
  KEBAB = 'plain',
  DROPDOWN = 'default',
}

export type ActionMenuOptions = {
  /** Optional flag to indicate whether action menu should be disabled */
  isDisabled?: boolean;
  /** Optional variant for action menu: DROPDOWN vs KEBAB (defaults to dropdown) */
  variant?: ActionMenuVariant;
  /** Optional label for action menu (defaults to 'Actions') */
  label?: string;
  /** Optional position (left/right) at which the action menu appears (defaults to right) */
  position?: DropdownPosition;
  /** Optional flag to indicate whether labels should appear to the left of icons for the action menu items (icon appears after the label by default) */
  displayLabelBeforeIcon?: boolean;
};

export type ActionMenuProps = EitherNotBoth<
  { actions: Action[] },
  { groupedActions: GroupedActions[] }
> &
  ActionMenuOptions;

export const ActionMenu: React.FC<ActionMenuProps> = ({
  actions = [],
  groupedActions = [],
  isDisabled,
  variant = ActionMenuVariant.DROPDOWN,
  label = 'Actions',
  position = DropdownPosition.right,
  displayLabelBeforeIcon,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isGrouped, setIsGrouped] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dropdownActionItems, setDropdownActionItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!_.isEmpty(groupedActions)) {
      setIsGrouped(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onToggle = (open: boolean) => {
    setIsOpen(open);
  };

  const onFocus = () => {
    const element = document.getElementById(`toggle-menu-${label}`);
    if (element) {
      element.focus();
    }
  };

  const onSelect = () => {
    setIsOpen(false);
    onFocus();
  };

  /** Returns a DropDownItem element corresponding to an action */
  const dropdownActionItem = React.useCallback(
    (action: Action) => {
      const externalIcon =
        'href' in action.cta &&
        'external' in action.cta &&
        action.cta.href &&
        action.cta.external ? (
          <ExternalLinkAltIcon />
        ) : null;
      const icon = action.icon ?? externalIcon;
      const href = 'href' in action.cta ? action.cta.href : undefined;
      const onClick =
        'callback' in action.cta && action.cta.callback ? action.cta.callback : undefined;
      return (
        <DropdownItem
          className={displayLabelBeforeIcon ? 'menu-item-with-label-before-icon' : ''}
          key={action.id}
          tooltip={action.tooltip}
          description={action.description}
          icon={icon}
          href={href}
          isDisabled={action.isDisabled}
          onClick={onClick}
        >
          {action.label}
        </DropdownItem>
      );
    },
    [displayLabelBeforeIcon],
  );

  React.useEffect(() => {
    let ddActionItems: JSX.Element[] = [];
    if (!_.isEmpty(actions)) {
      ddActionItems = actions.map((action: Action) => {
        return dropdownActionItem(action as Action);
      });
    }
    if (!_.isEmpty(groupedActions)) {
      ddActionItems = groupedActions.map((action: GroupedActions) => {
        // Grouped Actions
        return (
          <DropdownGroup label={action.groupLabel} key={action.groupId}>
            {action.groupActions.map((groupAction: Action) => dropdownActionItem(groupAction))}
          </DropdownGroup>
        );
      });
    }
    setDropdownActionItems(ddActionItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build dropdown
  return (
    <Dropdown
      onSelect={onSelect}
      position={position}
      toggle={
        variant === ActionMenuVariant.DROPDOWN ? (
          <DropdownToggle id={`toggle-menu-${label}`} onToggle={onToggle} isDisabled={isDisabled}>
            {label}
          </DropdownToggle>
        ) : (
          <KebabToggle id={`toggle-menu-${label}`} onToggle={onToggle} isDisabled={isDisabled} />
        )
      }
      isOpen={isOpen}
      dropdownItems={dropdownActionItems}
      isGrouped={isGrouped}
    />
  );
};

export default ActionMenu;
