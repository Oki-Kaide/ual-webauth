import {
    SignTransactionResponse,
    User,
    UALErrorType,
} from "universal-authenticator-library";
import {
    PackedTransaction,
    SignedTransaction,
} from "@greymass/eosio";
import { JsonRpc } from "eosjs";
import { UALWebAuthError } from "./UALWebAuthError";
import { LinkSession } from '@proton/web-sdk';

export class WebAuthUser extends User {
    public rpc: JsonRpc;
    public session: LinkSession;

    private signatureProvider: any;
    private chainId: string;
    private accountName: string = "";
    private requestPermission: string = "";

    constructor(rpc, identity) {
        super();
        const { session } = identity;
        this.accountName = String(session.auth.actor);
        this.chainId = String(session.chainId);

        this.requestPermission = String(session.auth.permission);
        this.session = session;
        this.rpc = rpc;
    }

    objectify(data: any) {
        return JSON.parse(JSON.stringify(data));
    }

    public async signTransaction(
        transaction,
        options
    ): Promise<SignTransactionResponse> {
        try {
            const res = await this.session.transact(transaction, options)
            const wasBroadcast = options.broadcast !== false;
            const serializedTransaction = PackedTransaction.fromSigned(
                SignedTransaction.from(res.transaction)
            );
            return this.returnEosjsTransaction(wasBroadcast, {
                ...res,
                transaction_id: res.payload.tx,
                serializedTransaction: serializedTransaction.packed_trx.array,
                signatures: this.objectify(res.signatures),
            });
        } catch (e: any) {
            const message = "Unable to sign transaction";
            const type = UALErrorType.Signing;
            const cause = e;
            throw new UALWebAuthError(message, type, cause);
        }
    }

    public async signArbitrary(
        publicKey: string,
        data: string,
        _: string
    ): Promise<string> {
        throw new UALWebAuthError(
            `WebAuth does not currently support signArbitrary(${publicKey}, ${data})`,
            UALErrorType.Unsupported,
            null
        );
    }

    public async verifyKeyOwnership(challenge: string): Promise<boolean> {
        throw new UALWebAuthError(
            `WebAuth does not currently support verifyKeyOwnership(${challenge})`,
            UALErrorType.Unsupported,
            null
        );
    }

    public async getAccountName() {
        return this.accountName;
    }

    public async getChainId() {
        return this.chainId;
    }

    public async getKeys() {
        try {
            const keys = await this.signatureProvider.getAvailableKeys(
                this.requestPermission
            );
            return keys;
        } catch (error: any) {
            const message = `Unable to getKeys for account ${this.accountName}.
        Please make sure your wallet is running.`;
            const type = UALErrorType.DataRequest;
            const cause = error;
            throw new UALWebAuthError(message, type, cause);
        }
    }

    public async isAccountValid() {
        try {
            const account = await this.rpc.get_account(this.accountName);
            const actualKeys = this.extractAccountKeys(account);
            const authorizationKeys = await this.getKeys();

            return (
                actualKeys.filter((key) => {
                    return authorizationKeys.indexOf(key) !== -1;
                }).length > 0
            );
        } catch (e: any) {
            if (e.constructor.name === "UALWebAuthError") {
                throw e;
            }

            const message = `Account validation failed for account ${this.accountName}.`;
            const type = UALErrorType.Validation;
            const cause = e;
            throw new UALWebAuthError(message, type, cause);
        }
    }

    public extractAccountKeys(account) {
        const keySubsets = account.permissions.map((permission) =>
            permission.required_auth.keys.map((key) => key.key)
        );
        let keys = [];
        for (const keySubset of keySubsets) {
            keys = keys.concat(keySubset);
        }
        return keys;
    }
}
