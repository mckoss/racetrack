// An easy to use interface for simple text buttons that look attractive
// but are not that fancy.
//
// This uses a wrapped flex box for the buttons so they automatically
// lay out in one or more rows as needed to fit the available space.

export { ButtonBar };
export type { Element, CheckboxInfo };

interface ElementInfo {
    type?: 'button' | 'checkbox' | 'choice';
    label: string;
}

interface ButtonInfo extends ElementInfo {
    type?: 'button';
    label: string;
    action: () => void;
}

interface CheckboxInfo extends ElementInfo {
    type: 'checkbox';
    label: string;
    value: boolean;
    action: (checked: boolean) => void;
}

interface ChoiceInfo extends ElementInfo {
    type: 'choice';
    label: string;
    value: string;
    choices: string[];
    action: (choice: string) => void;
}

type Element = ButtonInfo | CheckboxInfo | ChoiceInfo;

class ButtonBar {
    elements: Element[];
    container: HTMLDivElement;

    constructor(elements: Element[]) {
        this.elements = elements;
        this.container = document.createElement("div");
        this.container.className = "button-bar";

        for (let eltInfo of elements) {
            let elt: HTMLButtonElement | HTMLInputElement | HTMLLabelElement;
            switch (eltInfo.type) {
                case 'checkbox':
                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.checked = eltInfo.value;
                    elt = document.createElement('label');
                    elt.appendChild(input);
                    elt.appendChild(document.createTextNode(eltInfo.label));
                    input.addEventListener("change", () => {
                        const e = eltInfo as CheckboxInfo;
                        e.value = input.checked;
                        e.action(e.value);
                    });
                    break;

                case 'choice':
                    const select = document.createElement('select');
                    for (let choice of eltInfo.choices) {
                        const option = document.createElement('option');
                        option.value = choice;
                        option.textContent = choice;
                        select.appendChild(option);
                    }
                    select.value = eltInfo.value;
                    elt = document.createElement('label');
                    elt.textContent = eltInfo.label;
                    elt.appendChild(select);
                    select.addEventListener("change", () => {
                        const e = eltInfo as ChoiceInfo;
                        e.value = select.value;
                        e.action(e.value);
                    });
                    break;

                default:
                    elt = document.createElement('button');
                    elt.textContent = eltInfo.label;
                    elt.addEventListener("click", () => {
                        const e = eltInfo as ButtonInfo;
                        e.action();
                    });
                    break;
            }
            this.container.appendChild(elt);
        }
    }

    getElement() {
        return this.container;
    }
}
