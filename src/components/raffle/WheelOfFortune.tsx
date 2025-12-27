'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface WheelOfFortuneProps {
  players: string[]
  onPlayerEliminated: (player: string) => void
  onReset?: () => void
  onShufflePlayers?: () => void
  disabled?: boolean
}

export function WheelOfFortune({ 
  players, 
  onPlayerEliminated, 
  onReset,
  onShufflePlayers,
  disabled = false 
}: WheelOfFortuneProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [eliminatedPlayers, setEliminatedPlayers] = useState<string[]>([])
  const [rotation, setRotation] = useState(0)
  const [lastEliminated, setLastEliminated] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const currentRotationRef = useRef(0)

  // Получаем активных игроков (не выбывших)
  const activePlayers = players.filter(player => !eliminatedPlayers.includes(player))

  // Инициализация колеса
  useEffect(() => {
    if (canvasRef.current && !isSpinning) {
      drawWheel()
    }
  }, [players, eliminatedPlayers, rotation, isSpinning])

  const drawWheel = useCallback((rotationValue?: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (activePlayers.length === 0) {
      // Если нет активных игроков
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = '#1f2937'
      ctx.fill()
      ctx.strokeStyle = '#374151'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = '#9ca3af'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Все выбыли!', centerX, centerY)
      return
    }

    const anglePerPlayer = (Math.PI * 2) / activePlayers.length
    // Используем переданное значение или текущее из ref (во время анимации) или из state
    const currentRotation = (rotationValue ?? currentRotationRef.current ?? rotation) * (Math.PI / 180)
    // Сдвигаем начальный угол на -π/2, чтобы первый сектор начинался сверху (где стрелка)
    const startOffset = -Math.PI / 2

    // Рисуем сектора
    activePlayers.forEach((player, index) => {
      const startAngle = index * anglePerPlayer + currentRotation + startOffset
      const endAngle = (index + 1) * anglePerPlayer + currentRotation + startOffset

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      // Чередующиеся цвета - более яркие и контрастные
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
      const color = colors[index % colors.length]
      ctx.fillStyle = eliminatedPlayers.includes(player) ? '#6b7280' : color
      ctx.fill()

      // Обводка сектора
      ctx.strokeStyle = '#1f2937'
      ctx.lineWidth = 2
      ctx.stroke()

      // Добавляем текст
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(startAngle + anglePerPlayer / 2)
      
      ctx.font = '28px sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Сокращаем имя если слишком длинное
      const displayName = player.length > 10 ? player.substring(0, 8) + '...' : player
      ctx.fillText(displayName, radius * 0.7, 0)
      
      ctx.restore()
    })

    // Рисуем центральный круг
    ctx.beginPath()
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2)
    ctx.fillStyle = '#dc2626'
    ctx.fill()
    ctx.strokeStyle = '#991b1b'
    ctx.lineWidth = 3
    ctx.stroke()

    // Добавляем декоративные элементы
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2)
    ctx.strokeStyle = '#4b5563'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2)
    ctx.strokeStyle = '#6b7280'
    ctx.lineWidth = 1
    ctx.stroke()

    // Рисуем указатель вверху (указывает вниз) - поверх всех элементов
    const pointerY = 40
    ctx.beginPath()
    ctx.moveTo(centerX, pointerY) // Острие стрелки внизу
    ctx.lineTo(centerX - 20, 0) // Левая точка основания вверху
    ctx.lineTo(centerX + 20, 0) // Правая точка основания вверху
    ctx.closePath()
    ctx.fillStyle = '#ef4444'
    ctx.fill()
    ctx.strokeStyle = '#dc2626'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [activePlayers, eliminatedPlayers, rotation])

  const spinWheel = useCallback(() => {
    if (isSpinning || activePlayers.length === 0 || disabled) return

    setIsSpinning(true)
    const spinTime = 3000 + Math.random() * 2000 // 3-5 секунд
    const maxSpins = 5 + Math.random() * 3 // 5-8 полных оборотов
    const targetRotation = maxSpins * 360 + Math.random() * 360

    const startTime = Date.now()
    const startRotation = rotation
    currentRotationRef.current = rotation

    const animate = () => {
      const currentTime = Date.now()
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / spinTime, 1)

      // Easing функция для плавного замедления
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
      const easedProgress = easeOut(progress)

      const newRotation = startRotation + targetRotation * easedProgress
      const normalizedRotation = newRotation % 360
      
      // Обновляем ref для плавной анимации без ререндеров
      currentRotationRef.current = normalizedRotation
      
      // Перерисовываем колесо напрямую
      drawWheel(normalizedRotation)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Очищаем ref анимации
        animationFrameRef.current = null
        
        // Сохраняем финальное значение в state
        setRotation(normalizedRotation)
        
        // Определяем выбывшего игрока
        const finalRotation = normalizedRotation * (Math.PI / 180)
        const anglePerPlayer = (Math.PI * 2) / activePlayers.length
        const startOffset = -Math.PI / 2
        
        // Стрелка находится вверху и указывает вниз (-π/2 в canvas координатах)
        // Сектора начинаются с startOffset = -π/2
        // После вращения на finalRotation, сектор под стрелкой определяется так:
        // Стрелка указывает на угол -π/2 (вверху), в системе координат колеса это -π/2 - finalRotation
        // Учитывая startOffset, нужно найти индекс сектора
        let selectedAngle = -Math.PI / 2 - finalRotation - startOffset
        
        // Нормализуем угол в диапазон [0, 2π)
        while (selectedAngle < 0) selectedAngle += Math.PI * 2
        while (selectedAngle >= Math.PI * 2) selectedAngle -= Math.PI * 2
        
        // Определяем индекс сектора
        const selectedIndex = Math.floor(selectedAngle / anglePerPlayer) % activePlayers.length
        const eliminatedPlayer = activePlayers[selectedIndex]

        // Задержка перед объявлением результата
        setTimeout(() => {
          setEliminatedPlayers(prev => [...prev, eliminatedPlayer])
          setLastEliminated(eliminatedPlayer)
          onPlayerEliminated(eliminatedPlayer)
          setIsSpinning(false)
        }, 1000)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [isSpinning, activePlayers, rotation, disabled, onPlayerEliminated, drawWheel])

  const resetWheel = useCallback(() => {
    // Останавливаем анимацию если она идет
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    setEliminatedPlayers([])
    setRotation(0)
    currentRotationRef.current = 0
    setLastEliminated(null)
    setIsSpinning(false)
    if (onReset) onReset()
  }, [onReset])

  const eliminateRandom = useCallback(() => {
    if (activePlayers.length === 0 || disabled) return

    const randomIndex = Math.floor(Math.random() * activePlayers.length)
    const eliminatedPlayer = activePlayers[randomIndex]
    
    setEliminatedPlayers(prev => [...prev, eliminatedPlayer])
    setLastEliminated(eliminatedPlayer)
    onPlayerEliminated(eliminatedPlayer)
  }, [activePlayers, disabled, onPlayerEliminated])

  // Очистка анимации при размонтировании
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg shadow-black/40">
      <h2 className="mb-4 text-lg font-semibold text-zinc-100">
        Колесо выбывания
      </h2>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Левая часть - колесо и кнопки */}
        <div className="flex flex-col items-center flex-1">
          <div className="relative mb-4">
            <canvas
              ref={canvasRef}
              width={800}
              height={800}
              className="w-full max-w-2xl rounded-lg border border-zinc-700 bg-zinc-800"
            />
            <div className="mt-2 text-center text-sm text-zinc-400">
              Активных игроков: {activePlayers.length}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <button
              onClick={spinWheel}
              disabled={isSpinning || activePlayers.length === 0 || disabled}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                isSpinning || activePlayers.length === 0 || disabled
                  ? 'cursor-not-allowed bg-zinc-700 opacity-50'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSpinning ? 'Крутится...' : 'Крутить колесо'}
            </button>

            <button
              onClick={eliminateRandom}
              disabled={activePlayers.length === 0 || disabled}
              className={`rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors ${
                activePlayers.length === 0 || disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-zinc-700 hover:border-zinc-600'
              }`}
            >
              Случайное выбывание
            </button>

            <button
              onClick={resetWheel}
              className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700 hover:border-zinc-600"
            >
              Сбросить колесо
            </button>

            {onShufflePlayers && (
              <button
                onClick={onShufflePlayers}
                disabled={players.length === 0 || disabled}
                className={`rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors ${
                  players.length === 0 || disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-zinc-700 hover:border-zinc-600'
                }`}
              >
                Перемешать игроков
              </button>
            )}
          </div>
        </div>

        {/* Правая часть - список выбывших игроков */}
        <div className="lg:w-80 flex-shrink-0 flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg shadow-black/40">
          <h2 className="mb-4 flex-shrink-0 text-lg font-semibold text-zinc-100">
            Выбывшие игроки ({eliminatedPlayers.length})
          </h2>
          
          {/* Последний выбывший */}
          {lastEliminated && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 p-3">
              <div className="text-sm font-semibold text-red-400 mb-1">
                Последний выбывший:
              </div>
              <div className="text-lg font-bold text-red-300">
                {lastEliminated}
              </div>
            </div>
          )}

          {/* Список выбывших игроков */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {eliminatedPlayers.length === 0 ? (
              <div className="py-4 text-center text-sm text-zinc-500">
                Пока никто не выбыл
              </div>
            ) : (
              eliminatedPlayers.map((player, index) => (
                <div
                  key={`${player}-${index}`}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 transition-all hover:border-zinc-600 hover:bg-zinc-800/70"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-900/50 text-xs font-semibold text-red-300">
                        {index + 1}
                      </div>
                      <span className="text-sm font-semibold text-zinc-100">{player}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}