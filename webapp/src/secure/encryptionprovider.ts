export default interface EncryptionProvider {
    encrypt(text: string) : Promise<string>;
    encrypt(text: boolean) : Promise<string>;
    encrypt(text: number) : Promise<string>;
    decrypt(text: string) : Promise<string>;
}