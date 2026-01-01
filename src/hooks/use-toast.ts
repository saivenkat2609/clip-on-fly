import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 3; // UI/UX FIX #88: Increased from 1 to 3 for better UX
const TOAST_REMOVE_DELAY = 1000000;

// UI/UX FIX #88: Priority levels for toast queue
type ToastPriority = 'low' | 'normal' | 'high';

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  priority?: ToastPriority; // UI/UX FIX #88: Added priority
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

// UI/UX FIX #88: Toast queue for overflow handling
let toastQueue: ToasterToast[] = [];

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// UI/UX FIX #88: Sort toasts by priority (high > normal > low)
const sortByPriority = (toasts: ToasterToast[]): ToasterToast[] => {
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  return [...toasts].sort((a, b) => {
    const aPriority = priorityOrder[a.priority || 'normal'];
    const bPriority = priorityOrder[b.priority || 'normal'];
    return aPriority - bPriority;
  });
};

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      // UI/UX FIX #88: Queue management with priority
      if (state.toasts.length >= TOAST_LIMIT) {
        // Add to queue instead of showing immediately
        toastQueue.push(action.toast);
        toastQueue = sortByPriority(toastQueue);
        return state;
      }

      // Add toast and sort by priority
      const newToasts = sortByPriority([action.toast, ...state.toasts]).slice(0, TOAST_LIMIT);
      return {
        ...state,
        toasts: newToasts,
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        // UI/UX FIX #88: Clear queue when all toasts removed
        toastQueue = [];
        return {
          ...state,
          toasts: [],
        };
      }

      // Remove the toast
      const filteredToasts = state.toasts.filter((t) => t.id !== action.toastId);

      // UI/UX FIX #88: Show next toast from queue if available
      if (toastQueue.length > 0 && filteredToasts.length < TOAST_LIMIT) {
        const nextToast = toastQueue.shift()!;
        return {
          ...state,
          toasts: sortByPriority([...filteredToasts, nextToast]).slice(0, TOAST_LIMIT),
        };
      }

      return {
        ...state,
        toasts: filteredToasts,
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
