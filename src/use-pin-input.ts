import { useMachine } from "@zag-js/react";
import { ComponentProps } from "react";
import { machine, MachineOptions } from "./machine";

type LabelProps = ComponentProps<"label"> & {
  "data-part": string;
};

type InputProps = ComponentProps<"input"> & {
  "data-part": string;
};

export function usePinInput(options: MachineOptions) {
  const { name } = options;
  const [state, send] = useMachine(machine(options));
  const value = state.context.value;

  return {
    getLabelProps(): LabelProps {
      return {
        "data-part": "label",
        onClick() {
          send({ type: "LABEL_CLICK" });
        },
      };
    },
    getHiddenInputProps(): InputProps {
      return {
        "data-part": "input",
        name,
        type: "hidden",
        value: value.join(""),
      };
    },
    getInputProps(index: number): InputProps {
      return {
        "data-part": "input",
        value: value[index],
        maxLength: 2,
        onChange(e) {
          const { value } = e.target;
          send({ type: "INPUT", index, value });
        },
        onFocus() {
          send({ type: "FOCUS", index });
        },
        onBlur() {
          send({ type: "BLUR" });
        },
        onKeyDown(e) {
          const { key } = e;
          if (key === "Backspace") {
            send({ type: "BACKSPACE", index });
          }
        },
        onPaste(e) {
          e.preventDefault();
          const value = e.clipboardData.getData("text").trim();
          send({ type: "PASTE", value, index });
        },
      };
    },
    value,
  };
}
