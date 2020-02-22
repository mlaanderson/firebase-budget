interface PanelOptions {
    animate?: boolean;
    disabled?: boolean;
    dismissible?: boolean;
    display?: "reveal" | "push" | "overlay";
    initSelector?: string;
    position?: "left" | "right";
    positionFixed?: boolean;
    swipeClose?: boolean;
    theme?: "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";
}

interface JQuery {
    panel() : JQuery;
    panel(command: string) : JQuery;
    panel(options: PanelOptions) : JQuery;
}