"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class AesGcm256 {
    constructor(username, password) {
        this.m_ready = false;
        this.m_resolver = () => { };
        this.m_username = username;
        if (!username || username.length <= 0)
            throw "Invalid username";
        if (!password || password.length <= 0)
            throw "Invalid password";
        if (!window.crypto)
            throw "Cryptography library not present";
        (() => __awaiter(this, void 0, void 0, function* () {
            this.m_hash = yield this.hash(password);
            this.m_ready = true;
            this.m_resolver();
        }))();
    }
    ready() {
        return new Promise((resolve, reject) => {
            this.m_resolver = resolve;
        });
    }
    hash(password) {
        return __awaiter(this, void 0, void 0, function* () {
            let digest = yield crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
            return btoa(new Uint8Array(digest).reduce((s, b) => s + String.fromCharCode(b), ''));
        });
    }
    generateKey() {
        return __awaiter(this, void 0, void 0, function* () {
            let algo = {
                name: 'PBKDF2',
                hash: 'SHA-256',
                salt: new TextEncoder().encode(this.m_username),
                iterations: 1000
            };
            let derived = { name: 'AES-GCM', length: 256 };
            let encoded = new TextEncoder().encode(this.m_hash);
            let key = yield crypto.subtle.importKey('raw', encoded, algo, false, ['deriveKey']);
            return yield crypto.subtle.deriveKey(algo, key, derived, false, ['encrypt', 'decrypt']);
        });
    }
    encrypt(text) {
        return __awaiter(this, void 0, void 0, function* () {
            text = text.toString();
            let algo = {
                name: 'AES-GCM',
                length: 256,
                iv: crypto.getRandomValues(new Uint8Array(12))
            };
            let key = yield this.generateKey();
            let encoded = new TextEncoder().encode(text);
            let cipherText = yield crypto.subtle.encrypt(algo, key, encoded);
            let cipherArray = new Uint8Array(cipherText);
            let result = new Uint8Array(algo.iv.length + cipherArray.length);
            result.set(algo.iv);
            result.set(cipherArray, algo.iv.length);
            return btoa(result.reduce((p, c) => p + String.fromCharCode(c), ''));
        });
    }
    decrypt(text) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = atob(text).split('').map((c) => c.charCodeAt(0));
            let iv = new Uint8Array(data.slice(0, 12));
            let cipherText = new Uint8Array(data.slice(12));
            let algo = {
                name: 'AES-GCM',
                length: 256,
                iv: iv
            };
            let key = yield this.generateKey();
            let decrypted = yield crypto.subtle.decrypt(algo, key, cipherText);
            return new TextDecoder().decode(decrypted);
        });
    }
}
exports.default = AesGcm256;
