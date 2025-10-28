"use client"

import * as React from "react"
import { format, startOfDay, endOfDay } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value?: Date | null
  min?: Date
  max?: Date
  onChange?: (date: Date | null) => void
}

export default function DateTimePicker({ value, min, max, onChange }: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value ?? undefined)
  const [hour, setHour] = React.useState("12")
  const [minute, setMinute] = React.useState("00")
  const [ampm, setAmpm] = React.useState("AM")

  React.useEffect(() => {
    if (!value) return
    setDate(value)
    let h = value.getHours()
    const m = value.getMinutes()
    const isPM = h >= 12
    if (h === 0) h = 12
    else if (h > 12) h = h - 12
    setHour(h.toString().padStart(2, "0"))
    setMinute(m.toString().padStart(2, "0"))
    setAmpm(isPM ? "PM" : "AM")
  }, [value])

  // Final combined DateTime
  const selectedDateTime = React.useMemo(() => {
    if (!date) return null
    const d = new Date(date)
    let h = parseInt(hour)
    if (ampm === "PM" && h < 12) h += 12
    if (ampm === "AM" && h === 12) h = 0
    d.setHours(h, parseInt(minute), 0, 0)
    return d
  }, [date, hour, minute, ampm])

  const selectedTimestamp = React.useMemo(() => selectedDateTime?.getTime() ?? null, [selectedDateTime])

  const didInitRef = React.useRef(false)
  React.useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true
      return
    }
    onChange?.(selectedTimestamp != null ? new Date(selectedTimestamp) : null)
  }, [selectedTimestamp])

  return (
    <div className="flex flex-col gap-4">
      {/* Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-[250px] justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-fit">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            disabled={(d) => {
              if (min && d < startOfDay(min)) return true
              if (max && d > endOfDay(max)) return true
              return false
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Time Picker */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Select value={hour} onValueChange={setHour}>
          <SelectTrigger className="w-[62px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const h = i + 1
              return (
                <SelectItem key={h} value={h.toString().padStart(2, "0")}>
                  {h.toString().padStart(2, "0")}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        <span>:</span>

        <Select value={minute} onValueChange={setMinute}>
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["00", "15", "30", "45"].map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ampm} onValueChange={setAmpm}>
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Result */}
      <p className="text-sm text-muted-foreground">
        Selected:{" "}
        {selectedDateTime ? format(selectedDateTime, "PPP p") : "No date & time selected"}
      </p>
    </div>
  )
}
