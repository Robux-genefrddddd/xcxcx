import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme();
  const isDark = theme === "dark" || theme === "system";

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-900 group-[.toaster]:text-white group-[.toaster]:border-slate-800 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-slate-400",
          actionButton:
            "group-[.toast]:bg-blue-500 group-[.toast]:text-white hover:group-[.toast]:bg-blue-600",
          cancelButton:
            "group-[.toast]:bg-slate-700 group-[.toast]:text-white hover:group-[.toast]:bg-slate-600",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
