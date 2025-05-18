import { Graphics, Point } from 'pixi.js';
import { Actor } from './actor';
import { CollisionLayer, type Game } from './game';
import { Vector2 } from './math';
import { Collider, ColliderType } from './collider';
import { Rectangle } from '@pixi/math';

export class Bullet extends Actor {
    BULLET_SIZE = 2;

    initialPosition: Vector2;
    direction: Vector2;
    speed: number;
    sprite: Graphics;
    collider: Collider;
    damage: number;
    pierce: number = 1;
    range: number = 0; // 0 for infinite range

    constructor(
        game: Game,
        direction: Vector2,
        speed: number = 1,
        posX: number,
        posY: number,
        damage: number = 1,
        pierce: number = 1,
        range: number = 0
    ) {
        super(game);
        this.direction = direction;
        this.speed = speed;
        this.damage = damage;
        this.pierce = pierce;
        this.initialPosition = new Vector2(posX, posY);
        this.range = range;

        //this.colliderSprite = new Graphics()
        //	.rect(posX, posY, this.BULLET_SIZE, this.BULLET_SIZE)
        //	.fill(0xf85149);
        //this.addChild(this.colliderSprite);

        this.sprite = new Graphics().rect(0, 0, 2, 2).fill(0x1f1f1f);
        this.sprite.x = posX;
        this.sprite.y = posY;
        this.addChild(this.sprite);

        const colliderRect = new Rectangle(
            100,
            100,
            this.BULLET_SIZE,
            this.BULLET_SIZE
        );
        this.collider = Collider.single(colliderRect, ColliderType.BULLET);
        game.insertIntoCollisionLayer(this.collider, CollisionLayer.BULLETS);
    }

    override tick(game: Game, deltaTime: number): void {
        const didCollide = game.checkCollisionWithLayer(
            this.collider,
            CollisionLayer.BULLETS
        );

        if (didCollide) {
            console.log('didcollide');
            this.pierce -= 1;

            if (this.pierce <= 0) {
                game.removeCollider(this.collider, CollisionLayer.BULLETS);
                game.removeActorFromStage(this);
            }
        }

        this.sprite.x += this.speed * this.direction.x * deltaTime;
        this.sprite.y += this.speed * this.direction.y * deltaTime;

        this.collider.moveTo(this.sprite.x, this.sprite.y);

        this.sprite.x = this.sprite.x;
        this.sprite.y = this.sprite.y;

        //console.log(
        //	`Collider: ${this.collider.shapes[0].x},  ${this.collider.shapes[0].y}, Sprite: ${this.sprite.x} ${this.sprite.y}`
        //);

        this.collider.args = { damage: this.damage };

        const globalPos = this.sprite.toGlobal(new Point(0, 0));

        if (
            globalPos.x > game.getRealHeight() ||
            globalPos.x < 0 ||
            globalPos.y < 0 ||
            globalPos.y > game.getRealHeight()
        ) {
            game.removeCollider(this.collider, CollisionLayer.BULLETS);
            game.removeActorFromStage(this);
        }

        // get the length between initial and current, use it to delete if out of range

        if (this.range === 0) {
            return;
        }

        const distanceFromInitial = Math.sqrt(
            Math.pow(this.sprite.x - this.initialPosition.x, 2) +
                Math.pow(this.sprite.y - this.initialPosition.y, 2)
        );

        if (distanceFromInitial > this.range) {
            game.removeCollider(this.collider, CollisionLayer.BULLETS);
            game.removeActorFromStage(this);
        }
    }
}
