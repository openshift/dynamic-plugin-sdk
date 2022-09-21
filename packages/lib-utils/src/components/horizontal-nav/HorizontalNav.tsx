import { Tabs, Tab, TabTitleText } from '@patternfly/react-core';
import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '@patternfly/react-styles/css/utilities/Spacing/spacing.css';

type Tab = {
  /** Key for individual tab */
  key: string | number;
  /** Title for individual tab */
  title: string;
  /** Content for individual tab (provided as a React component) */
  content: React.ReactElement;
  /** aria-label for individual tab */
  ariaLabel: string;
};

type WithRouterProps = {
  /** URL parameters */
  params?: Record<string, string>;
  /** Navigate function */
  navigate?: ReturnType<typeof useNavigate>;
  /** Current location */
  location?: ReturnType<typeof useLocation>;
};

type HorizontalNavProps = {
  /** aria-label for all tabs */
  ariaLabel?: string;
  /** Properties for tabs */
  tabs: Tab[];
} & WithRouterProps;

const HorizontalNavTabs: React.FC<HorizontalNavProps> = ({
  ariaLabel,
  tabs,
  params,
  navigate,
  location,
}) => {
  const defaultActiveTab = tabs && tabs[0] ? tabs[0].key : 0; // Set first tab as the default active tab

  const activeTabFromUrlParam = params?.selectedTab;
  const isValidTabFromUrl =
    activeTabFromUrlParam && tabs?.some((tab) => tab.key === activeTabFromUrlParam);
  const activeTab = isValidTabFromUrl ? activeTabFromUrlParam : defaultActiveTab;

  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(activeTab);

  return (
    <Tabs
      mountOnEnter
      activeKey={activeTabKey}
      onSelect={(e, eventKey) => {
        setActiveTabKey(eventKey);
        if (location?.pathname && navigate) {
          const currentPathName = location.pathname;
          if (params?.selectedTab) {
            navigate(currentPathName.replace(params.selectedTab, eventKey as string), {
              replace: true,
            });
          } else {
            navigate(`${currentPathName}/${eventKey as string}`);
          }
        }
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
            <div className="pf-u-m-md">{tab.content}</div>
          </Tab>
        );
      })}
    </Tabs>
  );
};

const withRouter = <T extends WithRouterProps>(Component: React.ComponentType<T>) => {
  return (props: Omit<T, keyof WithRouterProps>) => {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <Component {...(props as T)} params={params} navigate={navigate} location={location} />;
  };
};

const HorizontalNav = withRouter(HorizontalNavTabs as React.ComponentType<HorizontalNavProps>);

export { HorizontalNav, HorizontalNavTabs, Tab, HorizontalNavProps, withRouter };
