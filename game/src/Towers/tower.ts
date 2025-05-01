import { Graphics } from 'pixi.js';
import { Actor } from '../actor';
import type { Game } from '../game';
import { Bullet } from '../bullet';
import { Vector2 } from '../math';

// Not for inheritance, just an example
export class Tower extends Actor {
	sprite: Graphics;
	timer: number = 0;
	attackDirection: Vector2 = new Vector2(1, 1);

	constructor(game: Game, centerPositionX: number, centerPositionY: number) {
		super(game);

		this.sprite = new Graphics()
			.rect(0, 0, 24, 24) // i have no idea why this is 8, shouldn't it be 12?
			.fill(0x1f1f1f);
		this.sprite.x = centerPositionX - 8;
		this.sprite.y = centerPositionY - 8;

		this.addChild(this.sprite);

		console.log(`spawned tower at ${centerPositionX} ${centerPositionY}`);
	}

	override tick(game: Game, deltaTime: number): void {
		if (this.timer <= 0) {
			const bullet = new Bullet(game, this.attackDirection, 1, this.sprite.x, this.sprite.y, 1);
			game.insertActorToStage(bullet);
			this.timer = 10;
		}

		this.timer -= deltaTime;
	}
}
