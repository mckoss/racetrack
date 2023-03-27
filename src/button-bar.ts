// An easy to use interface for simple text buttons that look attractive
// but are not that fancy.
//
// This uses a wrapped flex box for the buttons so they automatically
// lay out in one or more rows as needed to fit the available space.

export { ButtonBar };

interface ElementInfo {
    type?: 'button' | 'checkbox' | 'choice';
    label: string;
    value?: boolean | string;
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

type Element = ButtonInfo | CheckboxInfo

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
                        eltInfo.value = input.checked;
                        console.log(`Checkbox ${eltInfo.value} clicked`);
                        eltInfo.action(eltInfo.value!);
                    });
                    break;

                default:
                    elt = document.createElement('button');
                    elt.textContent = eltInfo.label;
                    elt.addEventListener("click", () => {
                        eltInfo.value = !eltInfo.value;
                        console.log(`Button ${eltInfo.value} clicked`);
                        eltInfo.action(eltInfo.value!);
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
