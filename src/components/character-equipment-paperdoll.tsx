'use client'

import React from 'react'
import { SafeImage } from '@/components/safe-image'
import { ItemTooltip } from '@/components/item-tooltip'

type EquipmentItem = {
	key?: string
	entry?: number
	icon?: string
	name?: string
	item_instance?: unknown
	quality?: number
}

const EQUIPMENT_SLOT_ORDER = {
	left: [
		{ key: 'head', label: 'Шлем' },
		{ key: 'neck', label: 'Шея' },
		{ key: 'shoulders', label: 'Плечи' },
		{ key: 'back', label: 'Плащ' },
		{ key: 'chest', label: 'Грудь' },
		{ key: 'body', label: 'Рубашка' },
		{ key: 'tabard', label: 'Гербовая накидка' },
		{ key: 'wrists', label: 'Наручи' },
	],
	right: [
		{ key: 'hands', label: 'Руки' },
		{ key: 'waist', label: 'Пояс' },
		{ key: 'legs', label: 'Штаны' },
		{ key: 'feet', label: 'Ступни' },
		{ key: 'finger1', label: 'Кольцо 1' },
		{ key: 'finger2', label: 'Кольцо 2' },
		{ key: 'trinket1', label: 'Аксессуар 1' },
		{ key: 'trinket2', label: 'Аксессуар 2' },
	],
	bottom: [
		{ key: 'mainhand', label: 'Правая рука' },
		{ key: 'offhand', label: 'Левая рука' },
		{ key: 'ranged', label: 'Дальнобойное' },
	],
}

function hasItemInstance (item: EquipmentItem | null | undefined): boolean {
	if (!item) return false
	const instance: unknown = item.item_instance
	return instance != null
}

function getItemByKey (
	equipments: Array<EquipmentItem> | null,
	key: string,
): EquipmentItem | null {
	if (!equipments) return null
	const item = equipments.find((it) => it.key === key)
	if (item && (item.entry !== undefined || hasItemInstance(item))) {
		return item
	}
	return null
}

function getQualityBorderClass (quality: number | undefined): string {
	switch (quality) {
	case 0:
		return 'border-zinc-500 hover:ring-zinc-500'
	case 1:
		return 'border-zinc-200 hover:ring-zinc-200'
	case 2:
		return 'border-green-500 hover:ring-green-500'
	case 3:
		return 'border-blue-500 hover:ring-blue-500'
	case 4:
		return 'border-purple-500 hover:ring-purple-500'
	case 7:
		return 'border-yellow-500 hover:ring-yellow-500'
	default:
		return 'border-zinc-700 hover:ring-zinc-700'
	}
}

function getAbsoluteSirusImageUrl (relativePath: string): string {
	if (relativePath.startsWith('http')) {
		return relativePath
	}
	return `https://sirus.su${relativePath}`
}

interface CharacterEquipmentPaperdollProps {
	equipments: Array<EquipmentItem> | null
	characterGuid: number
	statsNode?: React.ReactNode
}

export function CharacterEquipmentPaperdoll ({
	equipments,
	characterGuid,
	statsNode,
}: CharacterEquipmentPaperdollProps) {
	if (!equipments || equipments.length === 0) {
		return null
	}

	const renderSlot = (slotKey: string, size: 'lg' | 'md') => {
		const item = getItemByKey(equipments, slotKey)
		const itemHasInstance = item ? hasItemInstance(item) : false
		const hasValidItem =
			item && item.icon && (item.entry !== undefined || itemHasInstance)

		const boxClass =
			size === 'lg'
				? 'h-[52px] w-[52px]'
				: 'h-12 w-12'

		if (!hasValidItem || !item) {
			return (
				<div
					className={`${boxClass} rounded bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center`}
				>
					<span className='text-xs text-zinc-600'>—</span>
				</div>
			)
		}

		const content = (
			<SafeImage
				src={getAbsoluteSirusImageUrl(String(item.icon))}
				alt={item.name ?? (item.entry ? `Предмет ${item.entry}` : 'Предмет')}
				className='h-full w-full rounded cursor-pointer'
			/>
		)

		return (
			<div
				className={`${boxClass} rounded border-2 transition-all hover:ring-2 ${getQualityBorderClass(item.quality)}`}
			>
				{item.entry ? (
					<ItemTooltip
						itemId={item.entry}
						characterGuid={characterGuid}
					>
						{content}
					</ItemTooltip>
				) : (
					content
				)}
			</div>
		)
	}

	return (
		<div className='flex flex-col items-start w-fit flex-1'>
			<div className='flex gap-8 justify-start'>
				<div className='flex flex-col gap-2'>
					{EQUIPMENT_SLOT_ORDER.left.map((slot) => (
						<div
							key={`left-${slot.key}`}
							className='flex flex-col items-center gap-1'
						>
							{renderSlot(slot.key, 'lg')}
						</div>
					))}
				</div>

				{statsNode && (
					<div className='flex'>
						{statsNode}
					</div>
				)}

				<div className='flex flex-col gap-2'>
					{EQUIPMENT_SLOT_ORDER.right.map((slot) => (
						<div
							key={`right-${slot.key}`}
							className='flex flex-col items-center gap-1'
						>
							{renderSlot(slot.key, 'lg')}
						</div>
					))}
				</div>
			</div>

			<div className='mt-6 flex self-center gap-4'>
				{EQUIPMENT_SLOT_ORDER.bottom.map((slot) => (
					<div
						key={`bottom-${slot.key}`}
						className='flex flex-col items-center gap-1'
					>
						{renderSlot(slot.key, 'md')}
					</div>
				))}
			</div>
		</div>
	)
}