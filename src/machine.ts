import { createMachine } from "@zag-js/core";

type MachineState = {
  value: "idle" | "focused";
};

type MachineContext = {
  value: string[];
  focusedIndex: number;
  readonly isCompleted: boolean;
  onComplete?: (value: string[]) => void;
};

export type MachineOptions = {
  value?: string[],
  name?: string,
  onComplete?: (value: string[]) => void,
  numOfFields: number
};

export function machine(options: MachineOptions) {
  const { numOfFields, ...restOptions } = options
  return createMachine<MachineContext, MachineState>(
    {
      id: "pin-input",
      initial: "idle",
      context: {
        value: Array.from<string>({ length: numOfFields }).fill(""),
        ...restOptions,
        focusedIndex: -1
      },
      computed: {
        isCompleted(context) {
          return context.value.every((value) => value !== "");
        },
      },
      watch: {
        focusedIndex: ["executeFocus"], // when `context.focusedIndex` changed, call these actions
        isCompleted: ["invokeOnComplete"],
      },
      states: {
        idle: {
          on: {
            FOCUS: {
              // state will be set to `focus` when FOCUS event was sent
              target: "focused",
              actions: ["setFocusedIndex"], // actions that we want to execute when the FOCUS event triggered
            },
            LABEL_CLICK: {
              actions: ["focusFirstInput"],
            },
          }, // represents the event that can be sent
        },
        focused: {
          on: {
            BLUR: {
              target: "idle",
              actions: ["clearFocusedIndex"],
            },
            INPUT: {
              // we already in `focused` state and no state change needed, we can ignore `target`
              actions: ["setFocusedValue", "focusNextInput"],
            },
            BACKSPACE: {
              actions: ["clearFocusedValue", "focusPreviousInput"],
            },
            PASTE: {
              actions: ["setPastedValue", "focusLastEmptyInput"],
            },
          },
        },
      },
    },
    {
      actions: {
        setFocusedIndex(context, event) {
          // `event` represents event object that passed from `send(object)` arg
          context.focusedIndex = event.index;
        },
        clearFocusedIndex(context, event) {
          context.focusedIndex = -1;
        },
        setFocusedValue(context, event) {
          // always grab one char
          const eventValue: string = event.value;
          const focusedValue = context.value[context.focusedIndex];
          const nextValue = getNextValue(focusedValue, eventValue);
          context.value[context.focusedIndex] = nextValue;
        },
        clearFocusedValue(context) {
          context.value[context.focusedIndex] = "";
        },
        focusNextInput(context, event) {
          const nextIndex = Math.min(
            context.focusedIndex + 1,
            context.value.length - 1
          );
          context.focusedIndex = nextIndex;
        },
        focusPreviousInput(context) {
          const previousIndex = Math.max(0, context.focusedIndex - 1);
          context.focusedIndex = previousIndex;
        },
        setPastedValue(context, event) {
          const pastedValue: string[] = event.value
            .split("")
            .slice(0, context.value.length);
          pastedValue.forEach((value, index) => {
            context.value[index] = value;
          });
        },
        focusLastEmptyInput(context) {
          const index = context.value.findIndex((v) => v === "");
          const lastIndex = context.value.length - 1; // prevent the overflow
          context.focusedIndex = index === -1 ? lastIndex : index;
        },
        focusFirstInput(context) {
          context.focusedIndex = 0;
        },
        // effects
        executeFocus(context) {
          const inputGroup = document.querySelector("[data-part=input-group]");
          if (!inputGroup || context.focusedIndex == -1) return;

          const inputElements = Array.from(
            inputGroup.querySelectorAll<HTMLInputElement>("[data-part=input]")
          );
          const input = inputElements[context.focusedIndex];
          requestAnimationFrame(() => {
            input?.focus();
          });
        },
        invokeOnComplete(context) {
          if (!context.isCompleted) return;
          context.onComplete?.(Array.from(context.value)); // context.value is proxied, so need to convert to regular array
        },
      },
    }
  );
}

function getNextValue(focusedValue: string, eventValue: string) {
  // 2, 22 => 2
  let nextValue = eventValue;

  if (focusedValue[0] === eventValue[0]) {
    //  2, 29 => 9
    nextValue = eventValue[1];
  } else if (focusedValue[0] === eventValue[1]) {
    // 2, 92 => 9
    nextValue = eventValue[0];
  }

  return nextValue;
}
