class Secure {
    constructor(username, password) {
        this.m_ready = false;
        this.m_resolver = () => { };
        this.m_username = username;

        if (password.length <= 0) throw "Invalid password";

        (async () =>  {
            this.m_hash = await this.hash(password);
            this.m_ready = true;
            this.m_resolver();
        })();
    }

    ready() {
        return new Promise((resolve, reject) => {
            this.m_resolver = resolve;
        });
    }

    async hash(password, salt) {
        let digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
        return btoa(new Uint8Array(digest).reduce((s, b) => s + String.fromCharCode(b), ''));
    }

    async generateKey() {
        let algo = {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt: new TextEncoder().encode(this.m_username),
            iterations: 1000
        };

        let derived = { name: 'AES-GCM', length: 256 };
        let encoded = new TextEncoder().encode(this.m_hash);
        let key = await crypto.subtle.importKey('raw', encoded, { name: 'PBKDF2' }, false, ['deriveKey']);
        
        return await crypto.subtle.deriveKey(algo, key, derived, false, ['encrypt', 'decrypt']);
    }

    async encrypt(text)  {
        let algo = {
            name: 'AES-GCM',
            length: 256,
            iv: crypto.getRandomValues(new Uint8Array(12))
        };

        let key = await this.generateKey();
        let encoded = new TextEncoder().encode(text);
        
        let cipherText = await crypto.subtle.encrypt(algo, key, encoded);

        let cipherArray = new Uint8Array(cipherText);
        let result = new Uint8Array(algo.iv.length + cipherArray.length);
        
        result.set(algo.iv);
        result.set(cipherArray, algo.iv.length);

        return btoa(result.reduce((p,c) => p + String.fromCharCode(c), ''));
    }

    async decrypt(text)  {
        let data = atob(text).split('').map((c) => c.charCodeAt(0));
        let iv = new Uint8Array(data.slice(0, 12));
        let cipherText = new Uint8Array(data.slice(12));

        let algo = {
            name: 'AES-GCM',
            length: 256,
            iv: iv
        };

        let key = await this.generateKey();
        let decrypted = await crypto.subtle.decrypt(algo, key, cipherText);
        
        return new TextDecoder().decode(decrypted);
    }

}

