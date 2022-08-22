import { Tabs, Tab, TabTitleText } from '@patternfly/react-core';
import React from 'react';

export type Tab = {
  /** Key for individual tab */
  key: string | number;
  /** Title for individual tab */
  title: string;
  /** Content for individual tab (provided as a React component) */
  content: React.ReactElement;
  /** aria-label for individual tab */
  ariaLabel: string;
};

export type HorizontalNavProps = {
  /** aria-label for all tabs */
  ariaLabel?: string;
  /** Properties for tabs */
  tabs: Tab[];
};

const HorizontalNav: React.FC<HorizontalNavProps> = ({ ariaLabel, tabs }) => {
  const activeTab = tabs && tabs[0] ? tabs[0].key : 0;
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(activeTab);

  return (
    <Tabs
      mountOnEnter
      activeKey={activeTabKey}
      onSelect={(e, tabIndex) => {
        setActiveTabKey(tabIndex);
      }}
      aria-label={ariaLabel}
      role="region"
    >
      {tabs.map((tab: Tab) => {
        return (
          <Tab
            key={tab.key}
            eventKey={tab.key}
            title={<TabTitleText>{tab.title}</TabTitleText>}
            aria-label={tab.ariaLabel}
          >
            {tab.content}
          </Tab>
        );
      })}
    </Tabs>
  );
};

export default HorizontalNav;
