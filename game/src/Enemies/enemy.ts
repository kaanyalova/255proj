import { Graphics } from "pixi.js";
import { Actor } from "../actor";
import { CollisionLayer, type Game } from "../game";
import type { MapNode } from "../map";
import { Vector2 } from "../math";
import { Collider, ColliderType } from "../collider";
import { Rectangle } from "@pixi/math";
import { SHOW_DEBUG_NEXT_NODE_MARKERS } from "../consts";

export class Enemy extends Actor {
  targetNode: MapNode | undefined;
  targetNodeIdx: number | undefined;
  sprite: Graphics | undefined;
  targetSprite: Graphics | undefined;
  speed: number;
  collider: Collider | undefined;
  isInvincible: boolean = false;
  invincibilityTimer: number = 0;
  health: number = 10;
  maxHealth: number = 10;
  healthBarSprite: Graphics | undefined;
  spriteColor: string | undefined;

  constructor(
    game: Game,
    speed: number = 2,
    spriteColor: string = "0x1f1f1f",
    health: number = 10
  ) {
    super(game);
    this.type = "Enemy";

    this.spriteColor = spriteColor;
    this.speed = speed;
    this.health = health;
    this.maxHealth = health;

    this.initializeMapNodes(game);
    this.sprite = new Graphics().rect(0, 0, 10, 10).fill(this.spriteColor);
    //console.log(`the color is ${this.spriteColor}`);
    this.sprite.x = game.gameMap!.mapNodes!.enterance.x;
    this.sprite.y = game.gameMap!.mapNodes!.enterance.y;
    this.spriteColor = spriteColor;

    this.setCollider(game);

    this.addChild(this.sprite);

    if (SHOW_DEBUG_NEXT_NODE_MARKERS) {
      this.targetSprite = new Graphics().rect(0, 0, 1, 1).fill(0x5c9171);
      this.addChild(this.targetSprite);
    }

    this.healthBarSprite = new Graphics().rect(0, 0, 10, 10).fill(0x61a478);
    this.sprite.addChild(this.healthBarSprite);
    this.drawHealthBar();
  }

  private initializeMapNodes(game: Game) {
    const initialNode = game.gameMap!.mapNodes?.nodes[0];

    if (!initialNode) {
      console.error("Inital map node doesnt exist");
      return;
    }

    this.targetNode = initialNode;
    this.targetNodeIdx = 0;
  }

  private moveToNextNode(game: Game, deltaTime: number) {
    const global = this.getGlobalPosition();

    // use the middle of the node instead of top left, so sprite does not have an offset when going though the path
    const middleOfSpriteX = this.sprite!.x + this.sprite!.width / 2;
    const middleOfSpriteY = this.sprite!.y + this.sprite!.height / 2;

    const xDistance = this.targetNode!.x - middleOfSpriteX;
    const yDistance = this.targetNode!.y - middleOfSpriteY;

    const distanceVector = new Vector2(xDistance, yDistance);
    const nodeDirection = distanceVector.normalize();

    this.sprite!.x += deltaTime * nodeDirection.x * this.speed;
    this.sprite!.y += deltaTime * nodeDirection.y * this.speed;

    if (SHOW_DEBUG_NEXT_NODE_MARKERS) {
      this.targetSprite!.x = this.targetNode!.x;
      this.targetSprite!.y = this.targetNode!.y;
    }

    //console.log(
    //	`Targetnode: ${this.targetNode!.x} ${this.targetNode!.y},Node vector: ${nodeVector.x} ${nodeVector.y},Distance: ${xDistance} ${yDistance}, This: ${this.x} ${this.y}, This global: ${global.x} ${global.y}`,
    //	`sprite: ${this.sprite!.x} ${this.sprite!.y}`
    //);

    // use the middle of the node instead of the top left
    if (Math.abs(distanceVector.x) + Math.abs(distanceVector.y) < 1) {
      this.targetNodeIdx! += 1;

      // no more nodes to navigate
      if (this.targetNodeIdx! > game.gameMap!.mapNodes!.nodes.length - 1) {
        this.onMapExit(game);

        //console.log('map exit');
        return;
      }

      this.targetNode = game.gameMap!.mapNodes!.nodes[this.targetNodeIdx!];
    }
  }

  private checkNodeCollisions() {}

  private setCollider(game: Game) {
    const shape = new Rectangle(
      game.gameMap!.mapNodes!.enterance.x,
      game.gameMap!.mapNodes!.enterance.y,
      10,
      10
    );

    this.collider = Collider.single(shape, ColliderType.ENEMY);
    // this will run with inside the collider class without the lambda
    this.collider.onGetHit = (args) => {
      const damage = args?.damage ?? 0;
      const uuid = args?.uuid ?? undefined;

      this.onCollide(game, damage, uuid);
    };

    game.insertIntoCollisionLayer(this.collider, CollisionLayer.BULLETS);
    game.insertIntoCollisionLayer(this.collider, CollisionLayer.TOWER_RAYCASTS);
  }

  override async init() {}

  override tick(game: Game, deltaTime: number) {
    this.moveToNextNode(game, deltaTime);
    this.collider!.moveTo(this.sprite!.x, this.sprite!.y);

    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= deltaTime;
    } else {
      this.isInvincible = false;
    }
  }

  private onCollide(
    game: Game,
    damage: number,
    bulletUUID: string | undefined
  ) {
    console.log(`hit for  ${damage}, health: ${this.health}/${this.maxHealth}`);

    this.health -= damage;
    this.drawHealthBar();
    if (this.health <= 0) {
      game.earnMoney(this.maxHealth);
      game.removeCollider(this.collider!, CollisionLayer.BULLETS);
      game.removeCollider(this.collider!, CollisionLayer.TOWER_RAYCASTS);
      game.removeActorFromStage(this);
    }
  }

  private drawHealthBar() {
    // 10 pixel space for health
    const greenPixels = Math.round((this.health / this.maxHealth) * 10);
    const redPixels = 10 - greenPixels;

    //console.log(greenPixels);

    this.healthBarSprite
      ?.clear()
      .rect(0, 12, greenPixels, 2)
      .fill(0x4ec9b0)
      .rect(greenPixels, 12, redPixels, 2)
      .fill(0xf88070);
  }

  private onMapExit(game: Game) {
    game.removeCollider(this.collider!, CollisionLayer.BULLETS);
    game.removeActorFromStage(this);
    game.loseHealth(this.maxHealth);
  }

  onUpgrade() {}
}
