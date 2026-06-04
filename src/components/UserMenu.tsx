"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, User } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="user-menu" ref={ref}>
      <div className="user-menu-bar">
        <ThemeToggle />
        <button
          onClick={() => setOpen(!open)}
          className="user-menu-btn"
        >
          <div className="user-menu-avatar">
            <User size={16} />
          </div>
          <span className="user-menu-name">Admin</span>
        </button>
      </div>

      {open && (
        <div className="user-menu-dropdown">
          <button
            onClick={() => {
              router.push("/settings");
              setOpen(false);
            }}
            className="user-menu-item"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button onClick={handleLogout} className="user-menu-item danger">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
