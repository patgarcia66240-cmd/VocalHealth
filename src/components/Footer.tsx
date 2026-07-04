/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function Footer() {
  return (
    <footer className="bg-linear-to-r from-natural-surface to-natural-card/20 border-t border-natural-border/50 mt-auto py-2 text-center text-[10px] text-natural-secondary" id="app-footer-layout">
      <div className="max-w-[95%] mx-auto px-3 flex items-center justify-center gap-4">
        <p className="font-medium">© {new Date().getFullYear()} VocalHealth</p>
        <div className="flex items-center gap-2 font-mono text-[9px] text-natural-primary/70">
          <span>🔒 Sécurisé</span>
          <span>•</span>
          <span>Stockage local</span>
        </div>
      </div>
    </footer>
  );
}
