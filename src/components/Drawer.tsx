import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useEscape } from "../hooks/useKeyboardShortcuts";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: "right" | "left";
  size?: "sm" | "md" | "lg";
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = "right",
  size = "md",
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEscape(onClose, isOpen);

  // Focus trap
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) {
        firstElement.focus();
      }
    }
  }, [isOpen]);

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  }[size];

  const positionClasses = {
    right: "right-0",
    left: "left-0",
  }[position];

  const slideVariants = {
    right: {
      hidden: { x: "100%" },
      visible: { x: 0 },
    },
    left: {
      hidden: { x: "-100%" },
      visible: { x: 0 },
    },
  }[position];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-natural-dark/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <div className={`fixed inset-y-0 ${positionClasses} z-50 flex`}>
            <motion.div
              ref={drawerRef}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={slideVariants}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`h-full ${sizeClasses} w-full bg-natural-surface border-l border-natural-border/50 shadow-2xl overflow-hidden flex flex-col`}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-natural-border/50 bg-natural-bg/30">
                  <h2 className="text-lg font-bold text-natural-dark">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-natural-bg rounded-lg transition-colors text-natural-secondary hover:text-natural-dark"
                    title="Fermer (Escape)"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
