'use client'

import { useState } from 'react'
import { addMonths, subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MonthView } from './MonthView'
import type { CalendarEvent } from './types'

const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Demo SLEP',                    date: new Date(2026, 3, 2),  type: 'reunion',     time: '10:00' },
  { id: '2', title: 'Enviar listado de Transportistas', date: new Date(2026, 3, 8),  type: 'tarea',       time: '09:00' },
  { id: '3', title: 'Financiamiento',                date: new Date(2026, 3, 13), type: 'oportunidad'              },
  { id: '4', title: 'Llamada de seguimiento',        date: new Date(2026, 3, 19), type: 'llamada',     time: '15:00' },
  { id: '5', title: 'Demo producto nuevo',           date: new Date(2026, 3, 22), type: 'video',       time: '11:00' },
  { id: '6', title: 'Cierre contrato LogiTrans',     date: new Date(2026, 3, 22), type: 'reunion',     time: '16:00' },
  { id: '7', title: 'Revisión propuesta comercial',  date: new Date(2026, 3, 28), type: 'tarea'                     },
]

export function CrmCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const goToPrev  = () => setCurrentDate((d) => subMonths(d, 1))
  const goToNext  = () => setCurrentDate((d) => addMonths(d, 1))
  const goToToday = () => setCurrentDate(new Date())

  const monthLabel = format(currentDate, "MMMM 'DE' yyyy", { locale: es }).toUpperCase()

  return (
    <div className="flex flex-col flex-1 rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <Button variant="outline" size="icon" onClick={goToPrev}>
          <ChevronLeft className="size-4" />
        </Button>

        <h2 className="text-sm font-bold tracking-wide">{monthLabel}</h2>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Ver semana actual
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <MonthView
        currentDate={currentDate}
        events={MOCK_EVENTS}
      />
    </div>
  )
}
