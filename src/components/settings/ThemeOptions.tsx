"use client"

import { useTheme } from "next-themes"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ThemeOptions() {
  const { theme, setTheme } = useTheme()

  return (
    <Tabs defaultValue={theme} onValueChange={setTheme} className="w-[400px]">
      <TabsList>
        <TabsTrigger value="light">Light</TabsTrigger>
        <TabsTrigger value="dark">Dark</TabsTrigger>
        <TabsTrigger value="system">System</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}