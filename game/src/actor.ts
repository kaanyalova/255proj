import { Assets, Bounds, Container, Sprite, type IHitArea } from 'pixi.js';
import type { Game } from './game';

export class Actor extends Container {
	uuid: string = '';

	constructor(game: Game) {
		super();
		this.uuid = crypto.randomUUID();
	}

	async init(game: Game) {}

	tick(game: Game, deltaTime: number) {}
}
