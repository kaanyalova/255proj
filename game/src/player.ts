import { Assets, Bounds, Rectangle, Sprite } from 'pixi.js';
import { Actor } from './actor';
import { CollisionLayer, type Game } from './game';
import { Collider } from './collider';
import { Vector2 } from './math';

export class Player extends Actor {
	//private hitBox: Collider;
	private isInvincible: boolean = false;
	private sprite: Sprite | null = null;
	private velocity: Vector2 = Vector2.unit();
	private speed: Vector2 = Vector2.zero();

	constructor(game: Game) {
		super(game);

		//this.hitBox = new Collider();
		console.log(this.velocity);
	}
	async init() {
		const texture = await Assets.load('https://pixijs.com/assets/bunny.png');
		this.sprite = new Sprite(texture);

		this.sprite.anchor.set(0.5);
		this.addChild(this.sprite);
		this.sprite.x = 400;
		this.sprite.y = 400;
	}

	private handleMovement(game: Game) {
		if (game.controls.up) {
			this.position.y -= 1;
		}

		if (game.controls.down) {
			this.position.y += 1;
		}

		if (game.controls.right) {
			this.position.x += 1;
		}

		if (game.controls.left) {
			this.position.x -= 1;
		}
	}

	override tick(game: Game) {
		this.handleMovement(game);
	}
}
