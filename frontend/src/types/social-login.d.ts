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

    export interface ReactFacebookFailureResponse {
        status?: string;
        error?: string;
    }

    export interface ReactFacebookLoginProps {
        appId: string;
        callback: (userInfo: ReactFacebookLoginInfo) => void;
        render: (props: { 
            onClick: () => void; 
            isProcessing: boolean; 
            isSdkLoaded: boolean; 
        }) => JSX.Element;
        onFailure?: (error: ReactFacebookFailureResponse) => void;
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

declare module 'react-facebook-login' {
    import { Component } from 'react';
    import { ReactFacebookLoginProps, ReactFacebookLoginInfo } from 'react-facebook-login/dist/facebook-login-render-props';

    export interface ReactFacebookLoginPropsWithButton extends Omit<ReactFacebookLoginProps, 'render'> {
        textButton?: string;
        typeButton?: string;
        icon?: React.ReactNode;
        cssClass?: string;
        buttonStyle?: React.CSSProperties;
    }

    export default class FacebookLogin extends Component<ReactFacebookLoginPropsWithButton> {}
    export { ReactFacebookLoginInfo };
}
