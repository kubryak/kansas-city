'use client'

import React from 'react'

interface CharacterCompareFormProps {
	onCompare: (name1: string, name2: string) => void
}

export function CharacterCompareForm({ onCompare }: CharacterCompareFormProps) {
	const [name1, setName1] = React.useState('')
	const [name2, setName2] = React.useState('')

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (name1.trim() && name2.trim()) {
			onCompare(name1.trim(), name2.trim())
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label
						htmlFor="character1"
						className="block text-sm font-medium text-zinc-300 mb-2"
					>
						Первый персонаж
					</label>
					<input
						id="character1"
						type="text"
						value={name1}
						onChange={(e) => setName1(e.target.value)}
						placeholder="Введите ник персонажа"
						className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
				<div>
					<label
						htmlFor="character2"
						className="block text-sm font-medium text-zinc-300 mb-2"
					>
						Второй персонаж
					</label>
					<input
						id="character2"
						type="text"
						value={name2}
						onChange={(e) => setName2(e.target.value)}
						placeholder="Введите ник персонажа"
						className="w-full px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
			</div>
			<button
				type="submit"
				disabled={!name1.trim() || !name2.trim()}
				className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
			>
				Сравнить
			</button>
		</form>
	)
}



