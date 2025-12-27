export interface RafflePrize {
	id: number
	name: string
	icon: string
	quantity: number
	rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}


