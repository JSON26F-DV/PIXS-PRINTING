declare module 'react-facebook-login/dist/facebook-login-render-props' {
    import { Component } from 'react';

    export interface ReactFacebookLoginInfo {
        id: string;
        accessToken: string;
        name?: string;
        email?: string;
        picture?: {
            data: {
                is_silhouette: boolean;
                url: string;
            };
        };
    }

    export interface ReactFacebookLoginProps {
        appId: string;
        callback: (userInfo: ReactFacebookLoginInfo) => void;
        render: (props: { 
            onClick: () => void; 
            isProcessing: boolean; 
            isSdkLoaded: boolean; 
        }) => JSX.Element;
        onFailure?: (error: any) => void;
        autoLoad?: boolean;
        fields?: string;
        scope?: string;
        version?: string;
        language?: string;
        xfbml?: boolean;
        cookie?: boolean;
        authType?: string;
        isDisabled?: boolean;
    }

    export default class FacebookLogin extends Component<ReactFacebookLoginProps> {}
}
