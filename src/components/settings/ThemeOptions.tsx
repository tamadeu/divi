"use client"

import { useTheme } from "next-themes"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ThemeOptions() {
  const { theme, setTheme } = useTheme()

  return (
    <Tabs defaultValue={theme} onValueChange={setTheme} className="w-[400px]">
      <TabsList>
        <TabsTrigger value="light">Claro</TabsTrigger>
        <TabsTrigger value="dark">Escuro</TabsTrigger>
        <TabsTrigger value="system">Sistema</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}