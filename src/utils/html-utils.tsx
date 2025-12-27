'use client'

import React from 'react'

/**
 * Обрабатывает HTML-теги в тексте: заменяет <br> на перенос строки, удаляет <span> теги
 * @param text - текст с возможными HTML-тегами
 * @returns React-элемент с обработанным текстом
 */
export function renderHtmlText(text: string | undefined | null): React.ReactNode {
	if (!text) return null

	// Обрабатываем HTML-теги: заменяем <br> на перенос строки, удаляем <span> теги
	const processedText = text
		.replace(/<br\s*\/?>/gi, '\n') // Заменяем <br> на перенос строки
		.replace(/<span[^>]*>/gi, '') // Удаляем открывающие <span> теги
		.replace(/<\/span>/gi, '') // Удаляем закрывающие </span> теги

	// Если есть переносы строк, разбиваем на строки
	if (processedText.includes('\n')) {
		return (
			<>
				{processedText.split('\n').map((line, index, array) => (
					<React.Fragment key={index}>
						{line}
						{index < array.length - 1 && <br />}
					</React.Fragment>
				))}
			</>
		)
	}

	return processedText
}



