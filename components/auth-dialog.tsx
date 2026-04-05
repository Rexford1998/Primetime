"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthed: (playerName: string, email: string) => void;
}

export function AuthDialog({ open, onOpenChange, onAuthed }: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    // preload from localStorage if present
    const storedName = localStorage.getItem("pf_player_name") || "";
    const storedEmail = localStorage.getItem("pf_player_email") || "";
    if (storedName) setName(storedName);
    if (storedEmail) setEmail(storedEmail);
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) return;
    localStorage.setItem("pf_player_name", name.trim());
    if (email.trim()) localStorage.setItem("pf_player_email", email.trim());
    onAuthed(name.trim(), email.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign in to play</DialogTitle>
          <DialogDescription>
            Set a display name (and email if you want). This will show up for your opponent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Display name</label>
            <Input
              value={name}
              placeholder="Player name"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Email (optional)</label>
            <Input
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={!name.trim()}>
            Save and Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
