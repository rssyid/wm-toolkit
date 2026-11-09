"use client";

import React, { useState } from "react";
import { AtSign, UserCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppUser } from "@/types";

interface MentionPickerProps {
  users: AppUser[];
  onSelectUser: (user: AppUser) => void;
  trigger?: React.ReactNode;
}

export function MentionPicker({
  users,
  onSelectUser,
  trigger,
}: MentionPickerProps) {
  const [open, setOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .replace(/^(Ir\.|Dr\.|Drs\.|Dra\.)\s*/i, "")
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-emerald-700 hover:border-emerald-300"
          >
            <AtSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mention</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0 shadow-lg border border-border"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Cari nama rekan kerja..." className="text-xs h-9" />
          <CommandList className="max-h-56">
            <CommandEmpty className="p-3 text-xs text-muted-foreground text-center">
              Pengguna tidak ditemukan.
            </CommandEmpty>
            <CommandGroup heading="Daftar Pengguna Aktif" className="text-[11px]">
              {users
                .filter((u) => u.status === "Active")
                .map((u) => (
                  <CommandItem
                    key={u.id}
                    value={`${u.name} ${u.role} ${u.estateName}`}
                    onSelect={() => {
                      onSelectUser(u);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-sm"
                  >
                    <Avatar className="w-7 h-7 text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden leading-tight">
                      <p className="text-xs font-medium text-foreground truncate">
                        {u.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        <span>{u.role}</span>
                        <span>&bull;</span>
                        <span className="truncate">{u.estateName}</span>
                      </p>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
