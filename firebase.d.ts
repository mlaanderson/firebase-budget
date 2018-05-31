declare namespace firebase {


    interface configOptions {
        apiKey: string;
        authDomain: string;
        databaseURL: string;
        storageBucket: string;
        messagingSenderId?: string;
    }

    function initializeApp(config: configOptions, name?: string) : app.App;

    namespace app {
        interface App {
            readonly name: string;
            readonly options: configOptions;

            auth() : auth.Auth;
            database() : database.Database;
            delete() : Promise<void>;
            messaging() : messaging.Messaging;
            storage() : storage.Storage;
        }
    
    }

    interface User {
        displayName?: string;
        email?: string;
        emailVerified: boolean;
        isAnonymous: boolean;
        metadata: auth.UserMetadata;
        phoneNumber?: string;
        photoURL?: string;
        providerData: UserInfo;
        providerId?: string;
        refreshToken: string;
        uid?: string;

        delete() : Promise<void>;
        getIdToken(forceRefresh?: boolean) : Promise<string>;
        getIdTokenResult(forceRefresh?: boolean) : Promise<auth.IdTokenResult>;
        linkAndRetrieveDataWithCredential(credential: auth.AuthCredential) : Promise<auth.UserCredential>;
        linkWithPhoneNumber(phoneNumber: string, applicationVerifier: auth.ApplicationVerifier) : Promise<auth.ConfirmationResult>;
        linkWithPopup(provider: auth.AuthProvider) : Promise<auth.UserCredential>;
        linkWithRedirect(provider: auth.AuthProvider) : Promise<void>;
        reauthenticateAndRetrieveDataWithCredential(credential: auth.AuthCredential) : Promise<auth.UserCredential>;
        reauthenticateWithCredential(credential: auth.AuthCredential) : Promise<void>;
        reauthenticateWithPhoneNumber(phoneNumber: string, applicationVerifier: auth.ApplicationVerifier) : Promise<auth.ConfirmationResult>;
        reauthenticateWithPopup(provider: auth.AuthProvider) : Promise<auth.UserCredential>;
        reauthenticateWithRedirect(provider: auth.AuthProvider) : Promise<void>;
        reload() : Promise<void>;
        sendEmailVerification(actionCodeSettings: auth.ActionCodeSettings) : Promise<void>;
        toJSON() : Object;
        unlink(providerId: string) : Promise<User>;
        updateEmail(newEmail: string) : Promise<void>;
        updatePassword(newPassword: string) : Promise<void>;
        updatePhoneNumber(phoneCredential: auth.AuthCredential) : Promise<void>;
        updateProfile(profile: { displayName?: string, photoURL?: string}) : Promise<void>;
    }

    interface UserInfo {
        displayName: string;
        email: string;
        phoneNumber: string;
        photoURL: string;
        providerId: string;
        uid: string;
    }

    namespace auth {
        interface Auth {
            // static Persistence: "LOCAL" | "NONE" | "SESSION";
            app : app.App;
            currentUser?: User;
            languageCode?: string;
            settings: AuthSettings;

            applyActionCode(code: string) : Promise<void>;
            checkActionCode(code: string) : Promise<ActionCodeInfo>;
            confirmPasswordReset(code: string, newPassword: string) : Promise<void>;
            createUserWithEmailAndPassword(email: string, password: string) : Promise<UserCredential>;
            fetchProvidersForEmail(email: string) : Promise<Array<string>>;
            fetchSignInMethodsForEmail(email: string) : Promise<Array<string>>;
            getRedirectResult() : Promise<UserCredential>;
            isSignInWithEmailLink(emailLink: string) : boolean;
            onAuthStateChanged(nextOrObserver: Object | ((user: User) => void), error?: Error, completed?: () => void) : () => void;
            onIdTokenChanged(nextOrObserver: Object | ((user: User) => void), error?: Error, completed?: () => void) : () => void;
            sendPasswordResetEmail(email: string, actionCodeSettings: ActionCodeSettings) : Promise<void>;
            sendSignInLinkToEmail(email: string, actionCodeSettings: ActionCodeSettings) : Promise<void>;
            setPersistence(persistence: Persistence) : Promise<void>;
            signInAndRetrieveDataWithCredential(credential: AuthCredential) : Promise<UserCredential>;
            signInAndRetrieveDataWithCustomToken(token: string) : Promise<UserCredential>;
            signInAndRetrieveDataWithEmailAndPassword(email: string, password: string) : Promise<UserCredential>;
            signInAnonymously() : Promise<void>;
            signInAnynymouslyAndRetrieveData() : Promise<UserCredential>;
            signInWithCredential(credential: AuthCredential) : Promise<User>;
            signInWithCustomToken(token: string) : Promise<UserCredential>;
            signInWithEmailAndPassword(email: string, password: string) : Promise<UserCredential>;
            signInWithEmailLink(email: string, emailLink?: string) : Promise<UserCredential>;
            signInWithPhoneNumber(phoneNumber: string, applicationVerifier: ApplicationVerifier) : Promise<ConfirmationResult>;
            signInWithPopup(provider: AuthProvider) : Promise<UserCredential>;
            signInWithRedirect(provider: AuthProvider) : Promise<void>;
            signOut() : Promise<void>;
            updateCurrentUser(user: User) : Promise<void>;
            useDeviceLanguage() : void;
            verifyPasswordResetCode(code: string) : Promise<string>;
        }

        interface ActionCodeSettings {
            url: string;
            iOS: { bundleId: string } |  undefined;
            android: { packageName: string, installApp: (boolean | undefined), minimumVersion: (string | undefined) } | undefined;
            handleCodeInApp: (boolean | undefined);
        }
        interface ActionCodeInfo {
            operation: string;
            data: {email: string | undefined, fromEmail: string | undefined };
        }
        interface AdditionalUserInfo {
            providerId: string;
            profile: Object;
            username: string | undefined;
            isNewUser: boolean;
        }
        interface ApplicationVerifier {
            type: string;
            verify() : Promise<string>;
        }
        interface AuthCredential {
            providerId: string;
            signInMethod: string;
        }
        interface AuthProvider { providerId: string; }
        interface AuthSettings { appVerificationDisabledForTesting: boolean; }
        interface ConfirmationResult {
            verificationId: string;
            confirm(verificationCode: string) : Promise<UserCredential>;
        }
        interface Error {
            code: string;
            message: string;
        }
        interface IdTokenResult {
            authTime: string;
            claims: Object;
            expirationTime: string;
            issuedAtTime: string;
            signInProvider: string;
            token: string;
        }
        enum Persistence {
            LOCAL, NONE, SESSION
        }
        interface UserCredential {
            user: User;
            credential: AuthCredential;
            operationType: string | undefined;
            additionalUserInfo: AdditionalUserInfo;
        }
        interface UserMetadata {
            creationTime: string;
            lastSignInTime: string;
        }
    }

    namespace database {
        interface Database {
            app: app.App;

            goOffline(): void;
            goOnline() : void;
            ref(path?: string) : Reference;
            refFromURL(url: string) : Reference;
        }

        interface DataSnapshot {
            key: string | null;
            ref: Reference;

            child(path: string) : DataSnapshot;
            exists() : boolean;
            exportVal() : Object;
            forEach(action: (snapshot: DataSnapshot) => boolean | void) :boolean;
            getPriority() : string | number | null;
            hasChild(path: string) : boolean;
            hasChildren() : boolean;
            numChildren() : number;
            toJSON() : Object;
            val() : any;
        }

        interface Query {
            ref: Reference;

            endAt(value: number | string | boolean | null, key?: string) : Query;
            equalTo(value: number | string | boolean | null, key?: string) : Query;
            isEqual(other: Query) : boolean;
            limitToFirst(limit: number) : Query;
            limitToLast(limit: number) : Query;
            off(eventType: "value" | "child_added" | "child_changed" | "child_removed" | "child_moved", callback? : (snapshot: DataSnapshot, key?: string) => void, context?: Object) : void;
            on(eventType: "value" | "child_added" | "child_changed" | "child_removed" | "child_moved", callback? : (snapshot: DataSnapshot, key?: string) => void, cancelCallbackOrContext?: ((error: Error) => void) | Object, context?: Object) : (snapshot: DataSnapshot, prevChild: string) => void;
            once(eventType: "value" | "child_added" | "child_changed" | "child_removed" | "child_moved", successCallback? : (snapshot: DataSnapshot, key?: string) => void, failureCallbackOrContext?: ((error: Error) => void) | Object, context?: Object) : Promise<DataSnapshot>;
            orderByChild(key: string) : Query;
            orderByKey() : Query;
            orderByPriority() : Query;
            orderByValue() : Query;
            startAt(value: number | string | boolean | null, key?: string) : Query;
            toJSON() : Object;
            toString() : string;
        }

        interface Reference extends Query {
            key: string;
            parent: Reference;
            root: Reference;

            child(path: string) : Reference;
            onDisconnect() : OnDisconnect;
            push(value?: any, onComplete?: (error: Error) => void) : ThenableReference;
            remove(onComplete?: (error: Error) => void) : Promise<void>;
            set(value: any, onComplete?: (error: Error) => void) : Promise<void>;
            setPriority(priority: string | number | null, onComplete: (error: Error) => void) : Promise<void>;
            setWithPriority(newVal: any, newPriority: string | number | null, onComplete?: (error: Error) => void) : Promise<void>;
            transaction(transactionUpdate: (data: any) => void, onComplete?: (error: Error, completed: boolean, snapshot: DataSnapshot) => void, applyLocally?: boolean) : Promise<{committed: boolean, snapshot: DataSnapshot}>;
            update(values: Object, onComplete?: (error: Error) => void) : Promise<void>;
        }

        interface OnDisconnect {
            cancel(onComplete?: (error: Error) => void) : Promise<void>;
            remove(onComplete?: (error: Error) => void) : Promise<void>;
            set(value: any, onComplete?: (error: Error) => void) : Promise<void>;
            setWithPriority(value: any, priority: number | string | null, onComplete?: (error: Error) => void) : Promise<void>;
            update(values: Object, onComplete?: (error: Error) => void) : Promise<void>;
        }

        // Only really different in Javascript, allows push to return immediately
        interface ThenableReference extends Reference {}
    }

    namespace messaging {
        interface Messaging {

        }
    }

    namespace storage {
        interface Storage {

        }
    }
}

export default firebase;