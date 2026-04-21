'use client'

import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, setDoc, type QueryDocumentSnapshot } from 'firebase/firestore'
import { db, hasRequiredFirebaseConfig } from '@/lib/firebase'
import toast from 'react-hot-toast'

interface WatermelonCharacter {
	name: string
	fightsCount: number
	bossNames: string[]
	completeRun: boolean
	killsAfterFinal: number
	finalBossKillAt: number | null
	repeatedKillsAfterFinal: Array<{
		bossName: string
		datetime: number
	}>
}

interface WatermelonResponse {
	instanceId: number
	instanceName: string
	minFightsExclusive: number
	week_from: string
	week_to: string
	totalPages: number
	totalEntries: number
	characters: WatermelonCharacter[]
	error?: string
	details?: string
}

interface RaidViolatorGroup {
	instanceId: number
	instanceName: string
	violators: WatermelonCharacter[]
}

const INSTANCES = [
	{ id: 11, name: 'Каражан', thresholdText: 'fights > 10' },
	{ id: 15, name: 'Испытание крестоносца 25', thresholdText: 'fights > 5' },
	{ id: 14, name: 'Испытание крестоносца 10', thresholdText: 'fights > 5' },
	{ id: 17, name: 'Логово Груула', thresholdText: 'fights > 2' },
	{ id: 16, name: 'Логово Магтеридона', thresholdText: 'fights > 1' },
] as const

const COPIED_PLAYERS_COLLECTION = 'watermelonCopiedPlayers'

function buildCopiedKey(instanceId: number, playerName: string): string {
	return `${instanceId}:${playerName.toLowerCase()}`
}

function buildCopiedDocId(instanceId: number, playerName: string): string {
	return `${instanceId}_${encodeURIComponent(playerName.toLowerCase())}`
}

export default function WatermelonPage() {
	const [activeView, setActiveView] = useState<'single' | 'all'>('single')
	const [selectedId, setSelectedId] = useState<number | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [result, setResult] = useState<WatermelonResponse | null>(null)
	const [copiedPlayers, setCopiedPlayers] = useState<Record<string, boolean>>({})
	const [hideCopied, setHideCopied] = useState(false)
	const [copiedPlayerKey, setCopiedPlayerKey] = useState<string | null>(null)
	const [firebaseError, setFirebaseError] = useState<string | null>(null)
	const [copyStatus, setCopyStatus] = useState<string | null>(null)
	const [copyError, setCopyError] = useState<string | null>(null)
	const [isCopyingKey, setIsCopyingKey] = useState<string | null>(null)
	const [isBulkCopying, setIsBulkCopying] = useState(false)
	const [isScanningAll, setIsScanningAll] = useState(false)
	const [allRaidResults, setAllRaidResults] = useState<WatermelonResponse[]>([])

	const writeTextToClipboard = async (text: string): Promise<boolean> => {
		if (navigator.clipboard && window.isSecureContext) {
			await Promise.race([
				navigator.clipboard.writeText(text),
				new Promise((_, reject) => {
					window.setTimeout(() => {
						reject(new Error('Таймаут clipboard API'))
					}, 5000)
				}),
			])
			return true
		}

		const textArea = document.createElement('textarea')
		textArea.value = text
		textArea.style.position = 'fixed'
		textArea.style.opacity = '0'
		textArea.style.pointerEvents = 'none'
		document.body.appendChild(textArea)
		textArea.focus()
		textArea.select()

		let copied = false
		try {
			copied = document.execCommand('copy')
		} finally {
			document.body.removeChild(textArea)
		}

		return copied
	}

	
	const formatFightTime = (unixSeconds: number | null): string => {
		if (!unixSeconds || Number.isNaN(unixSeconds)) {
			return 'неизвестно'
		}

		const date = new Date(unixSeconds * 1000)
		const formatter = new Intl.DateTimeFormat('ru-RU', {
			timeZone: 'Europe/Moscow',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		})

		const parts = formatter.formatToParts(date)
		const get = (type: Intl.DateTimeFormatPartTypes): string => {
			return parts.find((part) => part.type === type)?.value ?? '00'
		}

		const year = get('year')
		const month = get('month')
		const day = get('day')
		const hours = get('hour')
		const minutes = get('minute')
		const seconds = get('second')

		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
	}

	const loadCopiedPlayers = async (instanceId: number) => {
		if (!db || !hasRequiredFirebaseConfig) {
			setCopiedPlayers({})
			return
		}

		try {
			const snapshot = await getDocs(collection(db, COPIED_PLAYERS_COLLECTION))
			const copiedMap: Record<string, boolean> = {}

			snapshot.forEach((docSnapshot: QueryDocumentSnapshot) => {
				const data = docSnapshot.data() as { instanceId?: number; name?: string; copied?: boolean }
				if (typeof data.instanceId === 'number' && data.name && data.copied !== false) {
					copiedMap[buildCopiedKey(data.instanceId, data.name)] = true
				}
			})

			setCopiedPlayers(copiedMap)
			setFirebaseError(null)
		} catch {
			setFirebaseError('Не удалось загрузить список уже скопированных игроков из Firebase.')
		}
	}

	const loadAllCopiedPlayers = async () => {
		if (!db || !hasRequiredFirebaseConfig) {
			setCopiedPlayers({})
			return
		}

		try {
			const snapshot = await getDocs(collection(db, COPIED_PLAYERS_COLLECTION))
			const copiedMap: Record<string, boolean> = {}

			snapshot.forEach((docSnapshot: QueryDocumentSnapshot) => {
				const data = docSnapshot.data() as { instanceId?: number; name?: string; copied?: boolean }
				if (typeof data.instanceId === 'number' && data.name && data.copied !== false) {
					copiedMap[buildCopiedKey(data.instanceId, data.name)] = true
				}
			})

			setCopiedPlayers(copiedMap)
			setFirebaseError(null)
		} catch {
			setFirebaseError('Не удалось загрузить список уже скопированных игроков из Firebase.')
		}
	}

	const buildPlayerCopyText = (instanceName: string, character: WatermelonCharacter): string => {
		const playerUrl = `https://sirus.su/base/character/x3/${encodeURIComponent(character.name)}`
		const repeatedKills = Array.isArray(character.repeatedKillsAfterFinal)
			? character.repeatedKillsAfterFinal
			: []

		const repeatedKillsText =
			repeatedKills.length === 0
				? 'Повторных убийств после ласта нет'
				: repeatedKills
					.map((kill) => `- ${kill.bossName}: ${formatFightTime(kill.datetime)}`)
					.join('\n')

		return [
			`Ник: ${character.name}`,
			`Ссылка: ${playerUrl}`,
			`Рейд: ${instanceName}`,
			`Ласт босс убит: ${formatFightTime(character.finalBossKillAt)}`,
			'Повторные убийства:',
			repeatedKillsText,
		].join('\n')
	}

	const markPlayersCopied = async (
		instanceId: number,
		instanceName: string,
		players: WatermelonCharacter[],
	) => {
		const firestoreDb = db

		if (!firestoreDb || !hasRequiredFirebaseConfig || players.length === 0) {
			return
		}

		await Promise.all(
			players.map((player) =>
				setDoc(
					doc(firestoreDb, COPIED_PLAYERS_COLLECTION, buildCopiedDocId(instanceId, player.name)),
					{
						instanceId,
						name: player.name,
						raidName: instanceName,
						copied: true,
						copiedAt: Date.now(),
						updatedAt: Date.now(),
					},
					{ merge: true },
				),
			),
		)
	}

	const copyPlayerInfo = async (instanceName: string, character: WatermelonCharacter, instanceId: number) => {
		const key = buildCopiedKey(instanceId, character.name)
		setCopyError(null)
		setCopyStatus(null)
		setIsCopyingKey(key)

		try {
 			const text = buildPlayerCopyText(instanceName, character)

			const copied = await writeTextToClipboard(text)
			if (!copied) {
				throw new Error('Браузер отклонил копирование в буфер обмена')
			}

			// Check localStorage for etozheadmin field
			const etozheadminValue = localStorage.getItem('etozheadmin')
			
			if (etozheadminValue === '1') {
				try {
					await markPlayersCopied(instanceId, instanceName, [character])
					setCopiedPlayers((prev) => ({
						...prev,
						[key]: true,
					}))
					setFirebaseError(null)
				} catch {
					setFirebaseError('Не удалось записать отметку о копировании в Firebase.')
				}
			}

			toast.success(`Скопировано: ${character.name}`)
			setCopiedPlayerKey(key)
			window.setTimeout(() => {
				setCopiedPlayerKey((current) => (current === key ? null : current))
			}, 1800)
		} catch (err) {
			setCopyError(
				err instanceof Error
					? `Копирование не выполнено: ${err.message}`
					: 'Копирование не выполнено',
			)
		} finally {
			setIsCopyingKey(null)
		}
	}

	const violatingNotCopiedCharacters = useMemo(() => {
		if (!result) {
			return [] as WatermelonCharacter[]
		}

		return result.characters.filter((character) => {
			const key = buildCopiedKey(result.instanceId, character.name)
			return character.killsAfterFinal > 0 && !copiedPlayers[key]
		})
	}, [copiedPlayers, result])

	const allRaidViolatorGroups = useMemo(() => {
		return allRaidResults
			.map((raidResult) => ({
				instanceId: raidResult.instanceId,
				instanceName: raidResult.instanceName,
				violators: raidResult.characters.filter((character) => {
					const key = buildCopiedKey(raidResult.instanceId, character.name)
					return character.killsAfterFinal > 0 && !copiedPlayers[key]
				}),
			}))
			.filter((group) => group.violators.length > 0)
	}, [allRaidResults, copiedPlayers])

	const allRaidViolatorCount = useMemo(() => {
		return allRaidViolatorGroups.reduce((acc, group) => acc + group.violators.length, 0)
	}, [allRaidViolatorGroups])

	const allRaidAlreadyCopiedCount = useMemo(() => {
		return allRaidResults.reduce((acc, raidResult) => {
			return (
				acc +
				raidResult.characters.reduce((innerAcc, character) => {
					const key = buildCopiedKey(raidResult.instanceId, character.name)
					return copiedPlayers[key] ? innerAcc + 1 : innerAcc
				}, 0)
			)
		}, 0)
	}, [allRaidResults, copiedPlayers])

	const copyAllViolators = async () => {
		if (!result || violatingNotCopiedCharacters.length === 0) {
			setCopyError('Нет игроков-нарушителей, которых нужно копировать.')
			return
		}

		setCopyError(null)
		setCopyStatus(null)
		setIsBulkCopying(true)

		try {
			const text = violatingNotCopiedCharacters
				.map((character) => buildPlayerCopyText(result.instanceName, character))
				.join('\n\n--------------------\n\n')

			const copied = await writeTextToClipboard(text)
			if (!copied) {
				throw new Error('Браузер отклонил копирование в буфер обмена')
			}

			// Check localStorage for etozheadmin field
			const etozheadminValue = localStorage.getItem('etozheadmin')
			
			if (etozheadminValue === '1') {
				try {
					await markPlayersCopied(result.instanceId, result.instanceName, violatingNotCopiedCharacters)
					setCopiedPlayers((prev) => {
						const next = { ...prev }
						for (const character of violatingNotCopiedCharacters) {
							next[buildCopiedKey(result.instanceId, character.name)] = true
						}
						return next
					})
					setFirebaseError(null)
				} catch {
					setFirebaseError('Не удалось записать отметки о копировании в Firebase.')
				}
			}

			toast.success(`Скопировано нарушителей: ${violatingNotCopiedCharacters.length}`)
		} catch (err) {
			setCopyError(
				err instanceof Error
					? `Копирование не выполнено: ${err.message}`
					: 'Копирование не выполнено',
			)
		} finally {
			setIsBulkCopying(false)
		}
	}

	const scanAllRaids = async () => {
		setActiveView('all')
		setSelectedId(null)
		setIsScanningAll(true)
		setCopyError(null)
		setCopyStatus(null)
		setFirebaseError(null)
		setError(null)

		try {
			await loadAllCopiedPlayers()
			const responses = await Promise.all(
				INSTANCES.map(async (instance) => {
					const res = await fetch(`/api/watermelon?instance=${instance.id}`, {
						cache: 'no-store',
					})

					const json = (await res.json()) as WatermelonResponse
					if (!res.ok || json.error) {
						throw new Error(json.details || json.error || `Не удалось загрузить рейд ${instance.name}`)
					}

					return json
				}),
			)

			setAllRaidResults(responses)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Неизвестная ошибка при проверке рейдов')
		} finally {
			setIsScanningAll(false)
		}
	}

	const copyAllRaidViolators = async () => {
		if (allRaidViolatorGroups.length === 0) {
			setCopyError('Нет игроков-нарушителей, которых нужно копировать.')
			return
		}

		setCopyError(null)
		setCopyStatus(null)
		setIsBulkCopying(true)

		try {
			const text = allRaidViolatorGroups
				.flatMap((group) =>
					group.violators.map((character) => buildPlayerCopyText(group.instanceName, character)),
				)
				.join('\n\n--------------------\n\n')

			const copied = await writeTextToClipboard(text)
			if (!copied) {
				throw new Error('Браузер отклонил копирование в буфер обмена')
			}

			// Check localStorage for etozheadmin field
			const etozheadminValue = localStorage.getItem('etozheadmin')
			
			if (etozheadminValue === '1') {
				try {
					await Promise.all(
						allRaidViolatorGroups.map((group) =>
							markPlayersCopied(group.instanceId, group.instanceName, group.violators),
						),
					)
					setCopiedPlayers((prev) => {
						const next = { ...prev }
						for (const group of allRaidViolatorGroups) {
							for (const character of group.violators) {
								next[buildCopiedKey(group.instanceId, character.name)] = true
							}
						}
						return next
					})
					setFirebaseError(null)
				} catch {
					setFirebaseError('Не удалось записать отметки о копировании в Firebase.')
				}
			}

			toast.success(`Скопировано нарушителей по всем рейдам: ${allRaidViolatorCount}`)
		} catch (err) {
			setCopyError(
				err instanceof Error
					? `Копирование не выполнено: ${err.message}`
					: 'Копирование не выполнено',
			)
		} finally {
			setIsBulkCopying(false)
		}
	}

	const filteredCharacters = useMemo(() => {
		if (!result) {
			return [] as WatermelonCharacter[]
		}

		let characters = result.characters.filter((character) => character.killsAfterFinal > 0)

		if (!hideCopied) {
			return characters
		}

		return characters.filter((character) => {
			const key = buildCopiedKey(result.instanceId, character.name)
			return !copiedPlayers[key]
		})
	}, [copiedPlayers, hideCopied, result])

	const copiedCount = useMemo(() => {
		if (!result) {
			return 0
		}

		return result.characters.reduce((acc, character) => {
			const key = buildCopiedKey(result.instanceId, character.name)
			return copiedPlayers[key] ? acc + 1 : acc
		}, 0)
	}, [copiedPlayers, result])

	const loadInstance = async (instanceId: number) => {
		setActiveView('single')
		setSelectedId(instanceId)
		setIsLoading(true)
		setError(null)

		try {
			const res = await fetch(`/api/watermelon?instance=${instanceId}`, {
				cache: 'no-store',
			})

			const json = (await res.json()) as WatermelonResponse

			if (!res.ok || json.error) {
				throw new Error(json.details || json.error || 'Не удалось загрузить данные')
			}

			setResult(json)
			void loadCopiedPlayers(json.instanceId)
		} catch (err) {
			setResult(null)
			setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<main className='mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-6 py-8'>
			<div className='rounded-xl border border-zinc-800 bg-zinc-900/70 p-6'>
				<h1 className='text-3xl font-bold text-zinc-100'>Поиск арбузов</h1>
				<p className='mt-2 text-sm text-zinc-400'>
					Выберите рейд или запустите проверку всех рейдов. Одновременно отображается только один режим.
				</p>
			</div>

			<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
				{INSTANCES.map((instance) => {
					const isActive = selectedId === instance.id
					return (
						<button
							key={instance.id}
							type='button'
							onClick={() => loadInstance(instance.id)}
							className={`rounded-xl border p-5 text-left transition-colors ${
								isActive
									? 'border-blue-500 bg-blue-500/10'
									: 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/70'
							}`}
						>
							<h2 className='text-xl font-semibold text-zinc-100'>{instance.name}</h2>
						</button>
					)
				})}
			</div>

			<div className='rounded-xl border border-zinc-800 bg-zinc-950/70 p-4'>
				<div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
					<div>
						<h2 className='text-lg font-semibold text-zinc-100'>Проверка всех рейдов</h2>
						<p className='text-sm text-zinc-400'>
							Запускает запросы по всем рейдам и выводит только нарушителей, которых еще не копировали.
						</p>
					</div>
					<div className='flex gap-2'>
						<button
							type='button'
							onClick={() => {
								void scanAllRaids()
							}}
							disabled={isScanningAll}
							className='rounded-md bg-blue-500/20 px-3 py-2 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60'
						>
							{isScanningAll ? 'Проверка...' : 'Проверить все рейды'}
						</button>
						<button
							type='button'
							onClick={() => {
								void copyAllRaidViolators()
							}}
							disabled={isBulkCopying || allRaidViolatorCount === 0}
							className='rounded-md bg-amber-500/20 px-3 py-2 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-60'
						>
							{isBulkCopying ? 'Копирование...' : `Скопировать всех нарушителей (${allRaidViolatorCount})`}
						</button>
					</div>
				</div>

				{allRaidResults.length > 0 && (
					<p className='mt-3 text-sm text-zinc-400'>
						Найдено нарушителей: {allRaidViolatorCount}. Уже скопировано: {allRaidAlreadyCopiedCount}.
					</p>
				)}

				{activeView === 'all' && allRaidResults.length === 0 && !isScanningAll && (
					<p className='mt-3 text-sm text-zinc-400'>
						Здесь будут выведены игроки со всех рейдов после запуска проверки.
					</p>
				)}
			</div>

			{activeView === 'all' && allRaidViolatorGroups.length > 0 && (
				<div className='rounded-xl border border-zinc-800 bg-zinc-950/70 p-6'>
					<h2 className='mb-4 text-xl font-semibold text-zinc-100'>Нарушители по всем рейдам</h2>
					<div className='space-y-4'>
						{allRaidViolatorGroups.map((group) => (
							<div key={group.instanceId} className='rounded-lg border border-zinc-800 bg-zinc-900/50 p-4'>
								<p className='mb-3 text-sm font-semibold text-zinc-200'>
									{group.instanceName} - {group.violators.length}
								</p>
								<div className='grid grid-cols-1 gap-2 md:grid-cols-3'>
									{group.violators.map((character) => (
										<div key={`${group.instanceId}-${character.name}`} className='rounded-md border border-amber-500 bg-amber-500/10 p-3'>
											<p className='text-sm text-zinc-100'>{character.name}</p>
											<p className='mt-1 text-xs text-zinc-400'>
												Ласт: {formatFightTime(character.finalBossKillAt)}
											</p>
											<p className='mt-1 text-xs text-zinc-400'>
												После ласта: {character.killsAfterFinal}
											</p>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{activeView === 'single' && (
				<div className='rounded-xl border border-zinc-800 bg-zinc-950/70 p-6'>
					{!result && !isLoading && !error && (
						<div className='flex min-h-[160px] items-center justify-center text-center'>
							<p className='max-w-md text-sm text-zinc-400'>
								Здесь будут выведены игроки выбранного рейда после запуска проверки.
							</p>
						</div>
					)}

				{!hasRequiredFirebaseConfig && (
					<p className='mb-3 text-sm text-amber-300'>
						Firebase не настроен. Отслеживание уже скопированных ников отключено.
					</p>
				)}

				{firebaseError && (
					<p className='mb-3 text-sm text-red-300'>{firebaseError}</p>
				)}

				{copyStatus && (
					<p className='mb-3 text-sm text-emerald-300'>{copyStatus}</p>
				)}

				{copyError && (
					<p className='mb-3 text-sm text-red-300'>{copyError}</p>
				)}

				{isLoading && <p className='text-zinc-300'>Загрузка данных...</p>}

				{error && !isLoading && (
					<p className='text-red-300'>Ошибка: {error}</p>
				)}

				{result && !isLoading && !error && (
					<>
						<div className='mb-4 flex flex-col gap-1 text-sm text-zinc-400'>
							<p>
								Инстанс: <span className='text-zinc-100'>{result.instanceName}</span>
							</p>
							<p>
								Период: {result.week_from} - {result.week_to}
							</p>
							<p>
								Страниц обработано: {result.totalPages}, записей: {result.totalEntries}
							</p>
							<p>
								Уже скопировано: {copiedCount}/{result.characters.length}
							</p>
						</div>

						<div className='mb-4'>
							<label className='inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-300'>
								<input
									type='checkbox'
									checked={hideCopied}
									onChange={(e) => setHideCopied(e.target.checked)}
									className='h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500'
								/>
								Скрыть игроков, которых уже копировали
							</label>
							<button
								type='button'
								onClick={() => {
									void copyAllViolators()
								}}
								disabled={isBulkCopying || violatingNotCopiedCharacters.length === 0}
								className='ml-3 rounded-md bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-60'
							>
								{isBulkCopying
									? 'Копирование нарушителей...'
									: `Копировать нарушителей (${violatingNotCopiedCharacters.length})`}
							</button>
						</div>

						{filteredCharacters.length === 0 ? (
							<p className='text-zinc-300'>
								Подходящих персонажей не найдено.
							</p>
						) : (
							<div className='grid grid-cols-1 gap-2 md:grid-cols-3'>
								{filteredCharacters.map((character) => {
									const hasKillsAfterFinal = character.killsAfterFinal > 0
									const isCopied = result
										? copiedPlayerKey === buildCopiedKey(result.instanceId, character.name)
										: false
									const isCopiedPersisted = result
										? !!copiedPlayers[buildCopiedKey(result.instanceId, character.name)]
										: false
									const isCopying = result
										? isCopyingKey === buildCopiedKey(result.instanceId, character.name)
										: false

									return (
									<div
										key={character.name}
										className={`rounded-lg border px-3 py-2 ${
											isCopiedPersisted
												? 'border-emerald-500 bg-emerald-500/10'
												: hasKillsAfterFinal
												? 'border-amber-500 bg-amber-500/10'
												: 'border-zinc-800 bg-zinc-900/60'
										}`}
									>
										<p className='text-zinc-100'>{character.name}</p>
										<div className='mt-2'>
											<button
												type='button'
												disabled={isCopying}
												onClick={() => {
													if (result) {
														void copyPlayerInfo(result.instanceName, character, result.instanceId)
													}
												}}
												className='rounded-md bg-blue-500/20 px-2 py-1 text-xs font-semibold text-blue-200 transition-colors hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60'
											>
												{isCopying
													? 'Копирование...'
													: isCopied || isCopiedPersisted
													? 'Скопировано'
													: 'Копировать инфо'}
											</button>
										</div>
										<p className='mt-1 text-xs text-zinc-400'>
											Убийств боссов: {character.fightsCount}
										</p>
										<p className='mt-1 text-xs text-zinc-400'>
											Полный проход: {character.completeRun ? 'да' : 'нет'}
										</p>
										<p className='mt-1 text-xs text-zinc-400'>
											Убийств после финального босса: {character.killsAfterFinal}
										</p>
										{hasKillsAfterFinal && (
											<p className='mt-1 text-xs font-semibold text-amber-300'>
												Есть убийства после финального босса
											</p>
										)}
										{character.repeatedKillsAfterFinal.length > 0 && (
											<div className='mt-1 text-xs text-zinc-500'>
												<p className='font-semibold text-amber-300'>Повторные убийства:</p>
												{character.repeatedKillsAfterFinal.map((kill, index) => (
													<p key={index} className='text-zinc-400'>
														{kill.bossName}: {formatFightTime(kill.datetime)}
													</p>
												))}
											</div>
										)}
									</div>
									)
								})}
							</div>
						)}
					</>
				)}
				</div>
			)}
		</main>
	)
}
