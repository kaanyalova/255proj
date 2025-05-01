import { Graphics } from 'pixi.js';
import { Actor } from '../actor';
import { Bullet } from '../bullet';
import { CollisionLayer, type Game } from '../game';
import { Vector2 } from '../math';
import { Tower } from './tower';
import { Rectangle } from '@pixi/math';
import { Collider, ColliderType } from '../collider';

// A tower that rotates to the users mouse, kind of like dartling gunner in bloons
export class GatlingGun extends Actor {
	sprite: Graphics;
	timer: number = 0;
	attackDirection: Vector2 = new Vector2(1, 1);
	collider: Collider;
	centerPositionX: number;
	centerPositionY: number;
	damage: number = 1;
	pierce: number = 2;
	bulletSpeed: number = 5;
	range: number = 0;

	constructor(game: Game, centerPositionX: number, centerPositionY: number) {
		super(game);
		this.centerPositionX = centerPositionX;
		this.centerPositionY = centerPositionY;

		this.sprite = new Graphics()
			.rect(0, 0, 10, 10) // i have no idea why this is 8, shouldn't it be 12?
			.fill(0x1f1f1f);
		this.sprite.x = centerPositionX - 8;
		this.sprite.y = centerPositionY - 8;

		this.addChild(this.sprite);
		this.collider = Collider.single(
			new Rectangle(this.sprite.x, this.sprite.y, 10, 10),
			ColliderType.TOWER
		);

		console.log(`spawned tower at ${centerPositionX} ${centerPositionY}`);
	}

	override tick(game: Game, deltaTime: number): void {
		if (this.timer <= 0) {
			const mouseVectorX = game.controls.mouseX - this.sprite.x;
			const mouseVectorY = game.controls.mouseY - this.sprite.y;

			const mouseVec = new Vector2(mouseVectorX, mouseVectorY).normalize();
			this.attackDirection = mouseVec;

			const bullet = new Bullet(
				game,
				this.attackDirection,
				this.bulletSpeed,
				this.sprite.x,
				this.sprite.y,
				this.damage,
				this.pierce,
				this.range
			);

			game.insertActorToStage(bullet);

			this.timer = 10;
		}

		this.timer -= deltaTime;
	}
}
