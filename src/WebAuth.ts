import {
    Authenticator,
    ButtonStyle,
    Chain,
    UALError,
    UALErrorType,
    User,
} from "universal-authenticator-library";
import { Name } from "./interfaces";
import { WebAuthUser } from "./WebAuthUser";
import { WebAuthLogo } from "./WebAuthLogo";
import { UALWebAuthError } from "./UALWebAuthError";
import ProtonWebSDK, { ConnectWalletArgs, ProtonWebLink, Link } from '@proton/web-sdk'

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export class WebAuth extends Authenticator {
    // Storage for WebAuthUser instances
    private users: WebAuthUser[] = [];
    // storage for the proton-link instance
    private link?: ProtonWebLink | Link;
    // options
    options: ConnectWalletArgs;

    /**
     * WebAuth Constructor.
     *
     * @param chains
     * @param options { appName }
     */
    constructor(chains: Chain[], options?: PartialBy<ConnectWalletArgs, 'linkOptions'>) {
        super(chains);

        // Establish initial values
        this.users = [];

        // Determine the default rpc endpoint for this chain
        const [chain] = chains;
        const chainId = chains[0].chainId;

        // Options
        if (options) {
            if (!options.linkOptions) {
                options.linkOptions = {} as any
            }
            options.linkOptions!.endpoints = options.linkOptions!.endpoints || chain.rpcEndpoints.map(_ => `${_.protocol}://${_.host}:${_.port}`),
            options.linkOptions!.chainId = options.linkOptions!.chainId || chainId,
            options.linkOptions!.restoreSession = options.linkOptions!.restoreSession || true

            this.options = options as ConnectWalletArgs;
        } else {
            this.options = {
                linkOptions: {
                    endpoints: chain.rpcEndpoints.map(_ => `${_.protocol}://${_.host}:${_.port}`),
                    chainId: chainId,
                    restoreSession: false
                },
                transportOptions: {
                    requestAccount: 'taskly'
                },
                selectorOptions: {
                    appName: "Taskly"
                }
            };
        }
        
    }

    /**
     * Called after `shouldRender` and should be used to handle any async actions required to initialize the authenticator
     */
    public async init() {
        const { link, session } = await ProtonWebSDK(this.options);
        this.link = link;

        if (session) {
            this.users = [new WebAuthUser(this.link?.client, { session })];    
        }
    }

    /**
     * Resets the authenticator to its initial, default state then calls `init` method
     */
    public reset() {
        this.users = [];
    }

    /**
     * Returns true if the authenticator has errored while initializing.
     */
    public isErrored() {
        return false;
    }

    /**
     * Returns a URL where the user can download and install the underlying authenticator
     * if it is not found by the UAL Authenticator.
     */
    public getOnboardingLink(): string {
        return "https://webauth.com";
    }

    /**
     * Returns error (if available) if the authenticator has errored while initializing.
     */
    public getError(): UALError | null {
        return null;
    }

    /**
     * Returns true if the authenticator is loading while initializing its internal state.
     */
    public isLoading() {
        return false;
    }

    public getName() {
        return "WebAuth";
    }

    /**
     * Returns the style of the Button that will be rendered.
     */
    public getStyle(): ButtonStyle {
        return {
            icon: WebAuthLogo,
            text: Name,
            textColor: "white",
            background: "rgb(90, 51, 201)",
        };
    }

    /**
     * Returns whether or not the button should render based on the operating environment and other factors.
     * ie. If your Authenticator App does not support mobile, it returns false when running in a mobile browser.
     */
    public shouldRender() {
        return !this.isLoading();
    }

    /**
     * Returns whether or not the dapp should attempt to auto login with the Authenticator app.
     * Auto login will only occur when there is only one Authenticator that returns shouldRender() true and
     * shouldAutoLogin() true.
     */
    public shouldAutoLogin() {
        return this.users.length > 0;
    }

    /**
     * Returns whether or not the button should show an account name input field.
     * This is for Authenticators that do not have a concept of account names.
     */
    public async shouldRequestAccountName(): Promise<boolean> {
        return false;
    }

    /**
     * Login using the Authenticator App. This can return one or more users depending on multiple chain support.
     *
     * @param accountName  The account name of the user for Authenticators that do not store accounts (optional)
     */
    public async login(): Promise<User[]> {
        if (this.chains.length > 1) {
            throw new UALWebAuthError(
                "UAL-WebAuth does not yet support providing multiple chains to UAL. Please initialize the UAL provider with a single chain.",
                UALErrorType.Unsupported,
                null
            );
        }
        try {
            // only call the login method if no users exist, to prevent UI from prompting for login during auto login
            //  some changes to UAL are going to be required to support multiple users
            if (this.users.length === 0) {
                const { link, session } = await ProtonWebSDK({ ...this.options, linkOptions: { ...this.options.linkOptions, restoreSession: false }});
                this.link = link;
        
                if (session) {
                    this.users = [new WebAuthUser(this.link?.client, { session })];    
                } else {
                    throw new Error("No session returned from login");
                }
            }
        } catch (e: any) {
            throw new UALWebAuthError(e.message, UALErrorType.Login, e);
        }
        return this.users;
    }

    /**
     * Logs the user out of the dapp. This will be strongly dependent on each Authenticator app's patterns.
     */
    public async logout(): Promise<void> {
        // Ensure a user exists to logout
        if (this.users.length) {
            // retrieve the current user
            const [user] = this.users;
            // remove the session from webauth
            await this.link?.removeSession(this.options.selectorOptions!.appName!, user.session.auth, this.options.linkOptions.chainId);
        }
        // reset the authenticator
        this.reset();
    }

    /**
     * Returns true if user confirmation is required for `getKeys`
     */
    public requiresGetKeyConfirmation(): boolean {
        return false;
    }
}
