import * as react from 'react';
import { ReactNode } from 'react';

/** Mount around the admin dashboard. The password and cookie remain server-side. */
declare function OMLAdminGate({ children, basePath }: {
    children: ReactNode;
    basePath?: string;
}): react.DetailedReactHTMLElement<{
    style: {
        minHeight: string;
        background: string;
    };
}, HTMLElement>;

export { OMLAdminGate };
