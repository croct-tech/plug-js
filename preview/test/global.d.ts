declare global {
    interface Window {
        recordEvent: <T>(event: T) => void;
    }
}

export {};
