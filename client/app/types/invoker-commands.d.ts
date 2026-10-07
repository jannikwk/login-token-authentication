// Type support for the Invoker Commands API (command / commandfor attributes)
// until @types/react ships them.
import "react";

declare module "react" {
    interface ButtonHTMLAttributes<T> {
        /** Invoker Commands API: command to run on the target element. */
        command?: string;
        /** Invoker Commands API: id of the element the command targets. */
        commandfor?: string;
    }
}
