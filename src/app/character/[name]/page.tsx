"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCharacter } from "@/hooks/use-character";
import { SafeImage } from "@/components/safe-image";
import { CharacterHeader } from "@/components/character-header";
import { CharacterProfessions } from "@/components/character-professions";
import { CharacterEquipmentSection } from "@/components/character-equipment-section";
import { CharacterTalentsSection } from "@/components/character-talents-section";
import {
	CharacterPveProgress,
	type PveTooltipState,
} from "@/components/character-pve-progress";
import {
  CLASS_NAMES,
  CLASS_ICON_MAP,
  RACE_NAMES,
  getSpecName,
  getSpecIcon,
  getFactionName,
  getFactionIcon,
  getClassColor,
  getAbsoluteSirusImageUrl,
} from "@/utils/character-meta";

export default function CharacterPage() {
  const params = useParams();
  const characterName = params.name as string;
  const {
    character,
    equipments,
    professions,
    secondarySkills,
    classTalents,
    glyphs,
    talents,
    pve,
    isLoading,
    isError,
  } = useCharacter(characterName);

  const [isPveExpanded, setIsPveExpanded] = React.useState(false);
  const [activeTooltip, setActiveTooltip] =
    React.useState<PveTooltipState | null>(null);

	if (isLoading) {
		return (
      <main className="mx-auto flex min-h-screen max-w-[1500px] items-center justify-center px-6 py-8">
        <p className="text-lg text-zinc-300">Загрузка данных персонажа…</p>
			</main>
    );
	}

	if (isError || !character) {
		return (
      <main className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-8 px-6 py-8">
				<Link
          href="/members"
          className="text-sm text-zinc-400 hover:text-zinc-200"
				>
					← Назад к составу гильдии
				</Link>
        <div className="flex items-center justify-center">
          <p className="text-lg text-red-500">
						Не удалось загрузить данные персонажа
					</p>
				</div>
			</main>
    );
	}

  const className = CLASS_NAMES[character.class] ?? `Класс ${character.class}`;
  const classColor = getClassColor(character.class);
  const classIcon = CLASS_ICON_MAP[character.class];
  const raceName = RACE_NAMES[character.race] ?? `Раса ${character.race}`;
	const raceIcon = character.raceIcon
		? getAbsoluteSirusImageUrl(character.raceIcon)
    : null;
  const specName =
    character.spec != null
		? getSpecName(character.class, character.spec)
      : null;
  const specIcon =
    character.spec != null
		? getSpecIcon(character.class, character.spec)
      : null;
  const factionName = getFactionName(character.faction);
  const factionIcon = getFactionIcon(character.faction);

	// Группируем PvE по рейдам (map_id) и сложностям
	const groupedPve = pve
		? Object.values(
        pve.reduce(
          (acc, instance) => {
            const mapId = instance.map_id;
					const existing = acc[mapId] ?? {
						mapId,
						mapName: instance.map_name,
						background: instance.background,
						difficulties: {} as Record<number, any>,
            };

            existing.difficulties[instance.difficulty] = instance;
            acc[mapId] = existing;
            return acc;
          },
          {} as Record<
            number,
            {
              mapId: number;
              mapName: string;
              background: string;
              difficulties: Record<number, any>;
            }
          >
        )
      )
    : [];

	return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-8 px-6 py-8">
			<Link
        href="/members"
        className="text-sm text-zinc-400 hover:text-zinc-200"
			>
				← Назад к составу гильдии
			</Link>

			{/* Основная информация о персонаже и экипировка */}
      <div className="flex gap-6">
				{/* Блок информации о персонаже */}
        <section className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 p-6">
          <CharacterHeader
            character={character}
            raceName={raceName}
            raceIcon={raceIcon}
            classNameText={className}
            classColor={classColor}
            classIcon={classIcon}
            specName={specName}
            specIcon={specIcon}
            factionName={factionName}
            factionIcon={factionIcon}
          />

          <CharacterProfessions
            professions={professions}
            secondarySkills={secondarySkills}
          />

          <CharacterPveProgress
            groupedPve={groupedPve}
            isPveExpanded={isPveExpanded}
            onToggleExpanded={() => setIsPveExpanded((prev) => !prev)}
            onSetTooltip={setActiveTooltip}
																		/>
				</section>

				{/* Блок экипировки */}
        <CharacterEquipmentSection
          equipments={equipments}
          characterGuid={character.guid}
          stats={character.stats}
        />
								</div>

      {/* Специализация, символы и таланты */}
      <CharacterTalentsSection
        classTalents={classTalents ?? []}
        glyphs={glyphs}
        characterTalents={talents}
        characterClass={character.class}
      />
      {typeof window !== "undefined" &&
        activeTooltip &&
        createPortal(
				<div
            className="fixed z-[100] w-64 rounded border border-zinc-700 bg-zinc-900/95 p-2 text-[11px] shadow-lg pointer-events-none"
					style={{
						left: `${activeTooltip.x}px`,
						top: `${activeTooltip.y}px`,
					}}
				>
            <div className="mb-1 font-semibold text-zinc-100">
              {activeTooltip.raidName} — {activeTooltip.difficulty}{" "}
              {activeTooltip.type}
					</div>
					<div>
						{activeTooltip.encounters.length > 0 ? (
                <ul className="space-y-0.5">
								{activeTooltip.encounters.map((encounter) => (
									<li
										key={encounter.name}
										className={
                        encounter.killed ? "text-green-400" : "text-zinc-100"
										}
									>
										{encounter.name}
									</li>
								))}
							</ul>
						) : (
                <div className="text-zinc-500">Нет данных по боссам</div>
						)}
					</div>
				</div>,
				document.body
			)}
		</main>
  );
}
