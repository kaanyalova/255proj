import { Graphics } from 'pixi.js';
import { Actor } from '../actor';
import { Bullet } from '../bullet';
import { CollisionLayer, type Game } from '../game';
import { Vector2 } from '../math';
import { Tower } from './tower';
import { Rectangle } from '@pixi/math';
import { Collider, ColliderType } from '../collider';

// A tower that rotates to the users mouse, kind of like dartling gunner in bloons
export class Seeker extends Actor {
	sprite: Graphics;
	timer: number = 0;
	attackDirection: Vector2 = new Vector2(1, 1);
	collider: Collider;
	centerPositionX: number;
	centerPositionY: number;
	rayVectors: Array<Vector2> | undefined;
	raySize: number;
	range: number = 10;

	constructor(game: Game, centerPositionX: number, centerPositionY: number, raySize: number = 10) {
		super(game);
		this.raySize = raySize;
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

		this.prepareRays();

		console.log(`spawned tower at ${centerPositionX} ${centerPositionY}`);
	}

	private prepareRays() {
		const sqrt2 = Math.sqrt(2);

		const rays = [
			new Vector2(0, -1).normalize().multWithNum(this.raySize),
			new Vector2(sqrt2, -sqrt2).normalize().multWithNum(this.raySize),
			new Vector2(1, 0).normalize().multWithNum(this.raySize),
			new Vector2(sqrt2, sqrt2).normalize().multWithNum(this.raySize),
			new Vector2(0, 1).normalize().multWithNum(this.raySize),
			new Vector2(-sqrt2, sqrt2).normalize().multWithNum(this.raySize),
			new Vector2(-1, 0).normalize().multWithNum(this.raySize),
			new Vector2(-sqrt2, -sqrt2).normalize().multWithNum(this.raySize)
		];

		this.rayVectors = rays;
	}

	override tick(game: Game, deltaTime: number): void {
		if (this.timer <= 0) {
			const mouseVectorX = game.controls.mouseX - this.sprite.x;
			const mouseVectorY = game.controls.mouseY - this.sprite.y;

			const mouseVec = new Vector2(mouseVectorX, mouseVectorY).normalize();
			this.attackDirection = mouseVec;

			//const bullet = new Bullet(game, this.attackDirection, 5, this.sprite.x, this.sprite.y, 2, 2);

			//game.insertActorToStage(bullet);

			const SIZE = 25;

			this.rayVectors!.forEach((vec) => {
				const didCollide = game.checkRaycastCollisionsWithLayer(
					this.collider,
					CollisionLayer.TOWER_RAYCASTS,
					vec,
					1,
					true
				);

				if (didCollide) {
					const bullet = new Bullet(
						game,
						vec.normalize(),
						5,
						this.sprite.x,
						this.sprite.y,
						undefined,
						undefined,
						this.range
					);
					game.insertActorToStage(bullet);
				}
			});

			this.timer = 1;
		}

		this.timer -= deltaTime;
	}
}
