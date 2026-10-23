import * as react from 'react';
import { CSSProperties } from 'react';

type OMLDashboardTheme = "light" | "dark";
/** Inline styles applied directly to named dashboard elements. */
interface OMLDashboardStyling {
    root?: CSSProperties;
    frame?: CSSProperties;
    shell?: CSSProperties;
    sidebar?: CSSProperties;
    navigation?: CSSProperties;
    navItem?: CSSProperties;
    activeNavItem?: CSSProperties;
    sidebarFooter?: CSSProperties;
    usage?: CSSProperties;
    content?: CSSProperties;
    main?: CSSProperties;
    pageHeading?: CSSProperties;
    title?: CSSProperties;
    description?: CSSProperties;
}
/** Complete embedded dashboard. Authentication is enforced by the server routes. */
declare function OMLDashboard({ theme, styling, }: {
    /** Visual theme. Omit or pass null for the default dark theme. */
    theme?: OMLDashboardTheme | null;
    styling?: OMLDashboardStyling;
}): react.JSX.Element;

export { OMLDashboard, type OMLDashboardStyling, type OMLDashboardTheme };
