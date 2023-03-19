// An easy to use interface for simple text buttons that look attractive
// but are not that fancy.
//
// This uses a wrapped flex box for the buttons so they automatically
// lay out in one or more rows as needed to fit the available space.

export { ButtonBar };

interface ButtonInfo {
    label: string;
    action: () => void;
}

class ButtonBar {
    buttons: ButtonInfo[];
    container: HTMLDivElement;

    constructor(buttons: ButtonInfo[]) {
        this.buttons = buttons;
        this.container = document.createElement("div");
        this.container.className = "button-bar";

        for (let button of buttons) {
            let buttonElement = document.createElement("button");
            buttonElement.textContent = button.label;
            buttonElement.addEventListener("click", button.action);
            this.container.appendChild(buttonElement);
        }
    }

    getElement() {
        return this.container;
    }
}
