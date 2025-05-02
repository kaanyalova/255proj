import { Collider, ColliderType } from "./collider";
import type { Actor } from "./actor";
import {
  extensions,
  Graphics,
  Loader,
  Point,
  Text,
  TextStyle,
  TextureStyle,
  type Application,
  type Container,
  type Renderer,
  type Ticker,
} from "pixi.js";
import { Player } from "./player";
import { GameMap } from "./map";
import { Enemy } from "./Enemies/enemy";
import { GameUI } from "./ui";
import type { Vector2 } from "./math";
import { Rectangle } from "@pixi/math";
import { lineIntersection } from "@pixi/math-extras";
import { SHOW_DEBUG_RAYCASTS } from "./consts";

type Controls = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  mouseX: number;
  mouseY: number;
  globalMouseX: number;
  globalMouseY: number;
  pointerDown: boolean;
};

function newControls(): Controls {
  return {
    up: false,
    down: false,
    right: false,
    left: false,
    mouseX: 0,
    mouseY: 0,
    globalMouseX: 0,
    globalMouseY: 0,
    pointerDown: false,
  };
}

export enum CollisionLayer {
  BULLETS,
  // layer containing towers and enemiesmone
  TOWER_RAYCASTS,
}

export class Game {
  START_MONEY_AMOUNT = 50;

  private app: Application;
  private scale: number;
  gameMap: GameMap | undefined;
  stage: Container;
  private colliders: Map<CollisionLayer, Map<string, Collider>> = new Map();
  private actors: Map<string, Actor> = new Map();
  private document: Document = document;
  controls: Controls = newControls();
  private recentCollisions: Set<string> = new Set();
  private healthText: Text | undefined;
  money: number = 50;
  private moneyText: Text | undefined;
  private roundText: Text | undefined;
  health: number = 100;

  constructor(app: Application, scale: number) {
    this.app = app;
    this.stage = app.stage;
    this.scale = scale;
  }

  setUpControls() {
    console.log("setup key events");
    this.document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.controls.left = true;
          break;
        case "ArrowRight":
          this.controls.right = true;
          break;
        case "ArrowDown":
          this.controls.down = true;
          break;
        case "ArrowUp":
          this.controls.up = true;
          break;
      }
    });

    this.document.addEventListener("keyup", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.controls.left = false;
          break;
        case "ArrowRight":
          this.controls.right = false;
          break;
        case "ArrowDown":
          this.controls.down = false;
          break;
        case "ArrowUp":
          this.controls.up = false;
          break;
      }
    });

    this.stage.addEventListener("pointermove", (e) => {
      const x = e.global.x / this.scale;
      const y = e.global.y / this.scale;

      this.controls.mouseX = x;
      this.controls.mouseY = y;
      this.controls.globalMouseX = e.global.x;
      this.controls.globalMouseY = e.global.y;
    });

    this.stage.addEventListener;

    this.stage.addEventListener("pointerdown", () => {
      this.controls.pointerDown = true;
    });

    this.stage.addEventListener("pointerup", () => {
      this.controls.pointerDown = false;
    });

    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;
  }

  async run() {
    this.setUpControls();
    TextureStyle.defaultOptions.scaleMode = "nearest";
    this.colliders.set(CollisionLayer.BULLETS, new Map());
    this.colliders.set(CollisionLayer.TOWER_RAYCASTS, new Map());

    //const levelManager = new LevelManager();
    //await levelManager.init();

    //this.stage.addChild(levelManager);

    const player = new Player(this);
    await this.registerActor(player);

    //const keyDisplay = new KeyDisplay();
    //await this.insertActorToStage(keyDisplay);

    this.gameMap = new GameMap(this);
    await this.insertActorToStage(this.gameMap!);

    const gameUI = new GameUI(this);
    await this.insertActorToStage(gameUI);

    this.initializeStatsUI();

    //const enemy = new Enemy(this);
    //await this.insertActorToStage(enemy);

    // clean the recent collisions set every second
    setInterval(() => {
      this.recentCollisions.clear();
    }, 1000);
  }

  tick(deltaTime: Ticker) {
    // Tick all the registered actors
    this.actors.forEach((actor, _uuid) => {
      actor.tick(this, deltaTime.deltaTime);
    });

    if (this.controls.down) {
      const enemy = new Enemy(this);
      this.insertActorToStage(enemy);
    }
  }

  // Inserts an actor to the game state, runs the async `actor.init()` function returns the uuid of the actor, and adds it to the stage root
  async insertActorToStage(actor: Actor): Promise<string> {
    await actor.init(this);
    this.actors.set(actor.uuid, actor);
    this.stage.addChild(actor);

    return actor.uuid;
  }

  // Only registers the actor and does not add it to the stage, useful when the actor is supposed to be the child of another container
  async registerActor(actor: Actor) {
    await actor.init(this);
    this.actors.set(actor.uuid, actor);

    return actor.uuid;
  }

  removeActorFromStage(actor: Actor) {
    const _actor = this.actors.get(actor.uuid);

    if (_actor) {
      this.stage.removeChild(_actor);
      this.actors.delete(actor.uuid);
    }
  }

  // Collision stuff

  insertIntoCollisionLayer(self: Collider, layer: CollisionLayer) {
    this.colliders.get(layer)?.set(self.uuid, self);
  }

  /**
   * check collsions in the selected layer for the select collider
   * if there are any collisions runs the onCollide() for the colliding
   * colliders that collide with `self` and returns true if there
   * are any collisions
   *
   * @param self
   * @param layer
   * @returns
   */

  checkCollisionWithLayer(
    self: Collider,
    layer: CollisionLayer,
    maxCollisions: number = 1
  ): boolean {
    const collidersOnThisLayer = this.colliders.get(layer);
    //console.log(collidersOnThisLayer);

    if (collidersOnThisLayer) {
      // retuns the colliders that are collided to, the receivers of the collision, the targets

      const collisionReceivers = Array.from(
        collidersOnThisLayer.entries()
      ).filter(([uuid, other]) => {
        return (
          self.collidesWithOther(other) &&
          self.uuid !== other.uuid &&
          self.colliderType !== other.colliderType
        ); // dont check collision with itself
      });

      const didCollide = collisionReceivers
        .slice(0, maxCollisions)
        .some(([_, receiver]) => {
          // sort so there are no duplicate uuid___uuid s like
          // a___b and b___a
          const key = [self.uuid, receiver.uuid].sort();

          if (this.recentCollisions.has(key[0] + "___" + key[1])) {
            return false;
          }

          this.recentCollisions.add(key[0] + "___" + key[1]);
          //console.log(this.recentCollisions);
          //console.log(receiver);
          //console.log(self);
          //console.log('---------');

          if (receiver.onGetHit) {
            receiver.onGetHit(self.args);
          }

          return true;
        });

      return didCollide;
    }

    return false;
  }

  checkRaycastCollisionsWithLayer(
    self: Collider,
    layer: CollisionLayer,
    ray: Vector2,
    maxCollisions: number = 1,
    visualise: boolean = false
  ): boolean {
    const collidersOnLayer = this.colliders.get(layer);

    if (collidersOnLayer) {
      const collisionReceivers = Array.from(collidersOnLayer.entries()).filter(
        ([uuid, other]) => {
          return (
            Collider.rayCast(self.shapes[0], other.shapes[0], ray) &&
            self.colliderType !== other.colliderType &&
            self.uuid !== other.uuid
          );
        }
      );

      collisionReceivers.slice(0, maxCollisions).forEach(([_, receiver]) => {
        //console.log(receiver);
        //console.log(self);
        //console.log('---------');

        if (receiver.onGetHit) {
          receiver.onGetHit();
        }
      });

      const middle = {
        x: self.shapes[0].x + self.shapes[0].width / 2,
        y: self.shapes[0].y + self.shapes[0].height / 2,
      };

      if (SHOW_DEBUG_RAYCASTS) {
        const shape = new Graphics()
          .moveTo(middle.x, middle.y)
          .lineTo(middle.x + ray.x, middle.y + ray.y)
          .setStrokeStyle({
            color: 0x58956d,
            width: 2,
          })
          .stroke();

        this.stage.addChild(shape);

        setTimeout(() => {
          this.stage.removeChild(shape);
        }, 100);
      }

      if (collisionReceivers.length > 0) {
        if (visualise) {
          //console.log(
          //	`line from ${middle.x} ${middle.y}, ${middle.x + ray.x}, ${middle.y + ray.y}`
          //);
        }

        return true;
      }
    }

    return false;
  }

  removeCollider(self: Collider, layer: CollisionLayer) {
    this.colliders.get(layer)?.delete(self.uuid);
  }

  initializeStatsUI() {
    console.log("init game ui");
    const textStyle = new TextStyle({
      fontSize: 10,
      fill: 0xf85149,
      letterSpacing: -1.5,
    });

    this.healthText = new Text({
      text: `${this.health} ❤️`,
      style: textStyle,
    });
    this.healthText.y = 200;
    this.healthText.x = 4;

    this.stage.addChild(this.healthText);

    const roundTextStyle = new TextStyle({
      fontSize: 10,
      fill: 0xdddddd,
    });

    this.roundText = new Text({
      style: roundTextStyle,
      text: `0/${this.gameMap!.waves!.length}`,
    });

    this.roundText.y = 185;
    this.roundText.x = 4;

    this.stage.addChild(this.roundText);

    const moneyTextStyle = new TextStyle({
      fontSize: 10,
      fill: 0x78521a,
    });

    this.moneyText = new Text({
      style: moneyTextStyle,
      text: `${this.START_MONEY_AMOUNT} $`,
    });

    this.moneyText.y = 172;
    this.moneyText.x = 4;
    this.stage.addChild(this.moneyText);
  }

  loseHealth(damage: number) {
    let currentHealth = this.health;
    currentHealth -= damage;
    if (currentHealth <= 0) {
      alert("you lose");
    }

    this.health = Math.max(0, currentHealth);
    this.healthText!.text = this.health + "❤️";
  }

  setRound(round: number, totalRounds: number) {
    if (this.roundText) {
      this.roundText.text = `${round}/${totalRounds}`;
    }
  }

  getCountOfActorOfType(type: string): number {
    return Array.from(this.actors).filter(([_, actor]) => {
      return actor.type === type;
    }).length;
  }

  /**
   * Returns if you can afford the purchase or not, if you can substracts the amount from the money
   */
  spendMoney(amount: number) {
    if (this.money - amount < 0) {
      return false;
    } else {
      console.log(`spend money ${this.money}`);
      this.money -= amount;
      this.moneyText!.text = `${this.money} $`;
      return true;
    }
  }

  earnMoney(amount: number) {
    this.money += amount;
    this.moneyText!.text = `${this.money} $`;
  }

  getWidth(): number {
    return 384;
  }

  getHeight(): number {
    return 216;
  }

  getRealWidth(): number {
    return this.app.canvas.height;
  }

  getRealHeight(): number {
    return this.app.canvas.width;
  }
}
