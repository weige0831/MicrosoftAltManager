import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "rounded-lg border font-sans",
        },
      }}
    />
  );
}

export { toast } from "sonner";
